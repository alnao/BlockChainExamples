import { EthProvider } from "./contexts/EthContext";
import Intro from "./components/Intro/";
import Setup from "./components/Setup";
import Demo from "./components/Demo";
import Footer from "./components/Footer";
import FundraiserComponent from "./FundraiserComponent";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <EthProvider>
      <div className="App">
        <FundraiserComponent />
      </div>
    </EthProvider>
  );
  /*
  return (
    <EthProvider>
      <div id="App">
        <div className="container">
          <Intro />
          <hr />
          <Setup />
          <hr />
          <Demo />
          <hr />
          <Footer />
        </div>
      </div>
    </EthProvider>
  );
  */
}

export default App;
