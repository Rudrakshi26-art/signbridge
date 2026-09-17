import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Hand } from "lucide-react";

import Home from "./pages/Home";
import Library from "./pages/Library";
import SignDetails from "./pages/SignDetails";
import Practice from "./pages/Practice";
import Dashboard from "./pages/Dashboard";
import Communicate from "./pages/Communicate";

import "./App.css";

function Navbar() {
  return (
    <nav className="navbar-new">
      <Link to="/" className="brand">
        <div className="brand-mark">
          <Hand size={21} />
        </div>

        <span>SignBridge</span>
      </Link>

      <div className="nav-links-new">
        <Link to="/">Home</Link>
        <Link to="/library">Learn</Link>
        <Link to="/practice">Practice</Link>
        <Link to="/communicate">Communicate</Link>
        <Link to="/dashboard">Progress</Link>
      </div>

      <Link to="/communicate" className="nav-cta">
        Start Communicating
      </Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />
        <Route path="/sign/:id" element={<SignDetails />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/communicate" element={<Communicate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;