import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import { Toaster } from "sonner";
import MarketTicker from "@/components/MarketTicker";
function App() {
    return (
        <div className="App">
        <MarketTicker />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                </Routes>
            </BrowserRouter>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: "#0E1B2C",
                        color: "#F6F1E8",
                        border: "1px solid #2A364B",
                        fontFamily: "'DM Sans', sans-serif",
                    },
                }}
            />
        </div>
    );
}

export default App;
