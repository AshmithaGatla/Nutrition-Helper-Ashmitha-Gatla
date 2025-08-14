import React, { useState } from "react";
import {
  Button,
  Form,
  Card,
  Container,
  Row,
  Col,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import "./FoodNutrition.css";

type FoodInfo = {
  ProductName: string;
  Calories: number;
  Fat: number;
  Carbohydrates: number;
  Sugars: number;
  Protein: number;
  Fiber: number;
  Image: string;
};

const Front = () => {
  const [input, setInput] = useState("");
  const [foodInfo, setFoodInfo] = useState<FoodInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/food-info-nutritionix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: input }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch food information");
      }

      const foodData = await res.json();
      setFoodInfo(foodData);
    } catch (err) {
      console.error(err);
      alert("Error fetching food information!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="front-page">
      <h2 className="front-title">Food Nutrition Search</h2>
      <InputGroup className="mb-4">
        <Form.Control
          placeholder="Enter food name (e.g. Apple, Pizza...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button variant="primary" onClick={handleSearch}>
          {loading ? <Spinner animation="border" size="sm" /> : "Search"}
        </Button>
      </InputGroup>

      {foodInfo && (
        <Row className="g-4">
          <Col md={6} lg={4}>
            <Card className="food-card">
              <Card.Body>
                <Card.Title>{foodInfo.ProductName}</Card.Title>
                <img
                  src={foodInfo.Image}
                  alt={foodInfo.ProductName}
                  className="img-fluid mb-3"
                />
                <Card.Text>
                  <strong>Calories:</strong> {foodInfo.Calories} kcal
                  <br />
                  <strong>Protein:</strong> {foodInfo.Protein} g
                  <br />
                  <strong>Carbs:</strong> {foodInfo.Carbohydrates} g
                  <br />
                  <strong>Fat:</strong> {foodInfo.Fat} g
                  <br />
                  <strong>Fiber:</strong> {foodInfo.Fiber} g
                  <br />
                  <strong>Sugar:</strong> {foodInfo.Sugars} g
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Front;
