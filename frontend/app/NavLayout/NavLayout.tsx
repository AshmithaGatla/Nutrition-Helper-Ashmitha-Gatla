import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Container from "react-bootstrap/cjs/Container";
import Nav from "react-bootstrap/cjs/Nav";
import Navbar from "react-bootstrap/cjs/Navbar";
import NavDropdown from "react-bootstrap/cjs/NavDropdown";
import "./NavLayout.css";

const NavLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const isAuthPage =
      location.pathname === "/login" ||
      location.pathname === "/forgot-password";
    if (!token && !isAuthPage) {
      window.location.href = "/login";
    }
  }, [navigate, location]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.innerWidth < 768) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  if (["/login", "/forgot-password"].includes(location.pathname)) {
    return null;
  }

  return (
    <Navbar
      fixed="top"
      variant="light"
      className={`custom-navbar ${showNavbar ? "show" : "hide"}`}
    >
      <Container className="nav-bar">
        <Navbar.Brand className="brand-title">
          <i className="bi bi-robot"></i> Nutrition Helper
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/">Home</Nav.Link>

          <Nav.Link href="/add-food">Add Food Entry</Nav.Link>
          <Nav.Link href="/get-food">Show Food Entries</Nav.Link>
          <Nav.Link href="/food-filter">Filter Food Entries</Nav.Link>
          <Nav.Link href="/linegraph">Monthly Nutrition Graph</Nav.Link>
          <Nav.Link href="/recommend-recipe">Recipe Recommendation</Nav.Link>
          <Nav.Link href="/food-info-nutritionix">
            Search Food Nutrition
          </Nav.Link>

          {/*<Nav.Link href="/report">Daily Report</Nav.Link>*/}
          <Nav.Link href="/logout">Logout</Nav.Link>
        </Nav>

        <Nav>
          <Nav.Link
            href="https://github.com/coloradocollective/s25-team-3-capstone"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="bi bi-github"></i> GitHub
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default NavLayout;
