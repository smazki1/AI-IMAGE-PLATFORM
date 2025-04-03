
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Styles from "./pages/Styles";
import Details from "./pages/Details";
import Payment from "./pages/Payment";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/styles" element={<Styles />} />
        <Route path="/details" element={<Details />} />
        <Route path="/payment" element={<Payment />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
