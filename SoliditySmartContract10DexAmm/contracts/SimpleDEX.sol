// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract SimpleDEX is ERC20 {
    IERC20 public tokenA; // NAO Token

    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountETH, uint256 liquidity);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountETH, uint256 liquidity);
    event Swap(address indexed user, uint256 amountIn, uint256 amountOut, string tokenIn);

    constructor(address _tokenA) ERC20("SimpleDEX LP", "SDL-LP") {
        tokenA = IERC20(_tokenA);
    }

    // Aggiunge liquidità al pool (NAO + ETH)
    function addLiquidity(uint256 amountA) external payable returns (uint256) {
        uint256 amountETH = msg.value;
        require(amountETH > 0, "Must send ETH");
        
        uint256 reserveA = tokenA.balanceOf(address(this));
        uint256 reserveETH = address(this).balance - amountETH; // Balance before this tx
        uint256 liquidity;

        if (totalSupply() == 0) {
            liquidity = Math.sqrt(amountA * amountETH);
        } else {
            liquidity = Math.min(
                (amountA * totalSupply()) / reserveA,
                (amountETH * totalSupply()) / reserveETH
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");

        tokenA.transferFrom(msg.sender, address(this), amountA);
        // ETH is already in contract via msg.value

        _mint(msg.sender, liquidity);
        
        emit LiquidityAdded(msg.sender, amountA, amountETH, liquidity);
        return liquidity;
    }

    // Rimuove liquidità dal pool
    function removeLiquidity(uint256 liquidity) external returns (uint256 amountA, uint256 amountETH) {
        require(balanceOf(msg.sender) >= liquidity, "Insufficient LP balance");

        uint256 reserveA = tokenA.balanceOf(address(this));
        uint256 reserveETH = address(this).balance;
        uint256 _totalSupply = totalSupply();

        amountA = (liquidity * reserveA) / _totalSupply;
        amountETH = (liquidity * reserveETH) / _totalSupply;

        _burn(msg.sender, liquidity);
        
        tokenA.transfer(msg.sender, amountA);
        payable(msg.sender).transfer(amountETH);

        emit LiquidityRemoved(msg.sender, amountA, amountETH, liquidity);
    }

    // Swap Token A (NAO) -> ETH
    function swapAforETH(uint256 amountIn) external returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid amount");
        
        uint256 reserveA = tokenA.balanceOf(address(this));
        uint256 reserveETH = address(this).balance;

        // Formula con fee 0.3%
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveETH;
        uint256 denominator = (reserveA * 1000) + amountInWithFee;
        amountOut = numerator / denominator;

        require(amountOut > 0, "Insufficient output amount");

        tokenA.transferFrom(msg.sender, address(this), amountIn);
        payable(msg.sender).transfer(amountOut);

        emit Swap(msg.sender, amountIn, amountOut, "TokenA");
    }

    // Swap ETH -> Token A (NAO)
    function swapETHforA() external payable returns (uint256 amountOut) {
        uint256 amountIn = msg.value;
        require(amountIn > 0, "Invalid amount");

        uint256 reserveA = tokenA.balanceOf(address(this));
        uint256 reserveETH = address(this).balance - amountIn;

        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveA;
        uint256 denominator = (reserveETH * 1000) + amountInWithFee;
        amountOut = numerator / denominator;

        require(amountOut > 0, "Insufficient output amount");

        tokenA.transfer(msg.sender, amountOut);

        emit Swap(msg.sender, amountIn, amountOut, "ETH");
    }
}
