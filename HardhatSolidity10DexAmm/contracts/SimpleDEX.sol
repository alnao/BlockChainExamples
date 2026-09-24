// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SimpleDEX is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // LP token bloccati per sempre al primo deposito (come Uniswap V2): rendono
    // antieconomico l'attacco di "inflation" del primo depositante
    uint256 public constant MINIMUM_LIQUIDITY = 1000;
    address private constant DEAD = 0x000000000000000000000000000000000000dEaD;

    IERC20 public immutable tokenA; // NAO Token

    // Riserve contabilizzate dal contratto: token o ETH inviati direttamente
    // (donazioni, selfdestruct) non alterano il prezzo del pool
    uint256 public reserveA;
    uint256 public reserveETH;

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountETH, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountETH, uint256 liquidity);
    // tokenIn = address(0) indica ETH
    event Swap(address indexed user, address indexed tokenIn, uint256 amountIn, uint256 amountOut);

    modifier ensure(uint256 deadline) {
        require(block.timestamp <= deadline, "Transaction expired");
        _;
    }

    constructor(address _tokenA) ERC20("SimpleDEX LP", "SDL-LP") {
        require(_tokenA != address(0), "Invalid token address");
        tokenA = IERC20(_tokenA);
    }

    // ---------- Funzioni di lettura ----------

    function getReserves() external view returns (uint256, uint256) {
        return (reserveA, reserveETH);
    }

    // Quantità di B equivalente ad amountA al prezzo corrente del pool (senza fee)
    function quote(uint256 amountA, uint256 _reserveA, uint256 _reserveB) public pure returns (uint256) {
        require(amountA > 0, "Invalid amount");
        require(_reserveA > 0 && _reserveB > 0, "Insufficient liquidity");
        return (amountA * _reserveB) / _reserveA;
    }

    // Formula Constant Product con fee 0.3%: out = in*997*rOut / (rIn*1000 + in*997)
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure returns (uint256) {
        require(amountIn > 0, "Invalid amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        uint256 amountInWithFee = amountIn * 997;
        return (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    // ---------- Liquidità ----------

    // Aggiunge liquidità (NAO + ETH). Viene usata solo la quantità nella proporzione corrente:
    // i NAO in eccesso non vengono prelevati, l'ETH in eccesso viene rimborsato
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountAMin,
        uint256 amountETHMin,
        uint256 deadline
    ) external payable nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountETH, uint256 liquidity) {
        require(msg.value > 0, "Must send ETH");
        require(amountADesired > 0, "Must send Token A");

        if (reserveA == 0 && reserveETH == 0) {
            (amountA, amountETH) = (amountADesired, msg.value);
        } else {
            uint256 amountAOptimal = quote(msg.value, reserveETH, reserveA);
            if (amountAOptimal <= amountADesired) {
                require(amountAOptimal >= amountAMin, "Slippage: insufficient A amount");
                (amountA, amountETH) = (amountAOptimal, msg.value);
            } else {
                uint256 amountETHOptimal = quote(amountADesired, reserveA, reserveETH);
                require(amountETHOptimal >= amountETHMin, "Slippage: insufficient ETH amount");
                (amountA, amountETH) = (amountADesired, amountETHOptimal);
            }
        }

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amountA * amountETH);
            require(liquidity > MINIMUM_LIQUIDITY, "Insufficient liquidity minted");
            liquidity -= MINIMUM_LIQUIDITY;
            _mint(DEAD, MINIMUM_LIQUIDITY);
        } else {
            liquidity = Math.min(
                (amountA * _totalSupply) / reserveA,
                (amountETH * _totalSupply) / reserveETH
            );
        }
        require(liquidity > 0, "Insufficient liquidity minted");

        reserveA += amountA;
        reserveETH += amountETH;
        _mint(msg.sender, liquidity);

        tokenA.safeTransferFrom(msg.sender, address(this), amountA);
        if (msg.value > amountETH) {
            Address.sendValue(payable(msg.sender), msg.value - amountETH);
        }

        emit LiquidityAdded(msg.sender, amountA, amountETH, liquidity);
    }

    // Rimuove liquidità bruciando LP token, con controlli di slippage e deadline
    function removeLiquidity(
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountETHMin,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountETH) {
        require(liquidity > 0, "Liquidity must be > 0");
        require(balanceOf(msg.sender) >= liquidity, "Insufficient LP balance");

        uint256 _totalSupply = totalSupply();
        amountA = (liquidity * reserveA) / _totalSupply;
        amountETH = (liquidity * reserveETH) / _totalSupply;

        require(amountA >= amountAMin, "Slippage: insufficient A amount");
        require(amountETH >= amountETHMin, "Slippage: insufficient ETH amount");

        _burn(msg.sender, liquidity);
        reserveA -= amountA;
        reserveETH -= amountETH;

        tokenA.safeTransfer(msg.sender, amountA);
        Address.sendValue(payable(msg.sender), amountETH);

        emit LiquidityRemoved(msg.sender, amountA, amountETH, liquidity);
    }

    // ---------- Swap ----------

    // Swap Token A (NAO) -> ETH
    function swapAforETH(
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountOut) {
        amountOut = getAmountOut(amountIn, reserveA, reserveETH);
        require(amountOut > 0, "Insufficient output amount");
        require(amountOut >= amountOutMin, "Slippage tolerance exceeded");

        reserveA += amountIn;
        reserveETH -= amountOut;

        tokenA.safeTransferFrom(msg.sender, address(this), amountIn);
        Address.sendValue(payable(msg.sender), amountOut);

        emit Swap(msg.sender, address(tokenA), amountIn, amountOut);
    }

    // Swap ETH -> Token A (NAO)
    function swapETHforA(
        uint256 amountOutMin,
        uint256 deadline
    ) external payable nonReentrant ensure(deadline) returns (uint256 amountOut) {
        amountOut = getAmountOut(msg.value, reserveETH, reserveA);
        require(amountOut > 0, "Insufficient output amount");
        require(amountOut >= amountOutMin, "Slippage tolerance exceeded");

        reserveETH += msg.value;
        reserveA -= amountOut;

        tokenA.safeTransfer(msg.sender, amountOut);

        emit Swap(msg.sender, address(0), msg.value, amountOut);
    }
}
