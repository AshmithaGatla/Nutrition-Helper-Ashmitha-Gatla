import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./front.css";
import { Link } from "react-router";
import Button from "react-bootstrap/cjs/Button";
import Form from "react-bootstrap/cjs/Form";
import InputGroup from "react-bootstrap/cjs/InputGroup";
import ListGroup from "react-bootstrap/cjs/ListGroup";
import Badge from "react-bootstrap/cjs/Badge";

type NutritionInfo = {
  calories: number;
  protein: number; // in grams
  carbohydrates: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
};

type FoodEntry = {
  id: string;
  user_id: string;
  name: string;
  portion: number; // in grams or servings
  unit: string; // "g" for grams or "serving"
  nutrition: NutritionInfo;
  meal_type: string; // breakfast, lunch, dinner, snack
  consumed_at: Date;
  created_at: Date;
};

interface UserStats {
  weight: number;
  height: number;
  age: number;
  gender: "male" | "female";
}

interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

const Front = () => {
  const [input, setInput] = useState("");
  const [foodSearches, setFoodSearches] = useState<FoodEntry[]>([]);
  const [foodAdded, setFoodAdded] = useState<FoodEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    weight: 70,
    height: 170,
    age: 30,
    gender: "male",
  });
  const [todayNutrition, setTodayNutrition] = useState<NutritionSummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!input.trim()) return;
    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        input
      )}&search_simple=1&action=process&json=1`
    );

    const isValidProduct = (product: any): boolean => {
      const n = product.nutriments;
      return (
        n &&
        n["energy-kcal"] != null &&
        n.proteins != null &&
        n.carbohydrates != null &&
        n.fat != null &&
        n.fiber != null &&
        n.sugars != null &&
        product.product_name != null &&
        product.id != null
      );
    };

    const mapToFoodEntry = (product: any): FoodEntry => {
      const n = product.nutriments;

      return {
        id: product.id,
        user_id: "", // populate from context
        name: product.product_name,
        portion: 100,
        unit: "g",
        nutrition: {
          calories: parseFloat(n["energy-kcal"]),
          protein: parseFloat(n.proteins),
          carbohydrates: parseFloat(n.carbohydrates),
          fat: parseFloat(n.fat),
          fiber: parseFloat(n.fiber),
          sugar: parseFloat(n.sugars),
        },
        meal_type: "snack",
        consumed_at: new Date(),
        created_at: new Date(),
      };
    };

    const data = await res.json();
    const names = data.products.map((p: any) => p.product_name).filter(Boolean);
    const validEntries: FoodEntry[] = data.products
      .filter(isValidProduct)
      .map(mapToFoodEntry);
    setFoodSearches(validEntries);
  };

  const getAddFoodFunc = (foodItem: FoodEntry) => () => {
    setFoodAdded([...foodAdded, foodItem]);
    setFoodSearches([]);
  };

  // BMR using Mifflin-St Jeor Equation
  const calculateDailyNeeds = () => {
    const { weight, height, age, gender } = userStats;
    const bmr =
      gender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161;

    return {
      calories: Math.round(bmr * 1.55),
      protein: Math.round(weight * 1.6),
      carbs: Math.round((bmr * 1.55 * 0.55) / 4),
      fat: Math.round((bmr * 1.55 * 0.25) / 9),
      fiber: 25,
    };
  };

  const fetchTodayNutrition = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const today = new Date().toLocaleDateString("en-CA");
      console.log(today);
      const response = await fetch("/api/filter-food-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          from_date: today,
          to_date: today,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch nutrition data");

      const entries = await response.json();

      const totals = entries.reduce(
        (acc: NutritionSummary, entry: any) => ({
          totalCalories: acc.totalCalories + entry.calories,
          totalProtein: acc.totalProtein + entry.protein,
          totalCarbs: acc.totalCarbs + entry.carbohydrates,
          totalFat: acc.totalFat + entry.fat,
          totalFiber: acc.totalFiber + entry.fiber,
        }),
        {
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
        }
      );

      setTodayNutrition(totals);
    } catch (error) {
      console.error("Error fetching nutrition data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayNutrition();
  }, []);

  return (
    <div className="front-wrapper">
      <h2 className="stats-title">Your Profile</h2>
      <div className="front-content-wrapper">
        <div className="left-column">
          <Form className="stats-form">
            <Form.Group className="mb-3">
              <Form.Label>Weight (kg)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter your weight"
                value={userStats.weight}
                onChange={(e) =>
                  setUserStats((prev) => ({
                    ...prev,
                    weight: Number(e.target.value),
                  }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Height (cm)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter your height"
                value={userStats.height}
                onChange={(e) =>
                  setUserStats((prev) => ({
                    ...prev,
                    height: Number(e.target.value),
                  }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Age (years)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter your age"
                value={userStats.age}
                onChange={(e) =>
                  setUserStats((prev) => ({
                    ...prev,
                    age: Number(e.target.value),
                  }))
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Select
                value={userStats.gender}
                onChange={(e) =>
                  setUserStats((prev) => ({
                    ...prev,
                    gender: e.target.value as "male" | "female",
                  }))
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </div>

        <div className="right-column">
          {todayNutrition && (
            <div className="nutrition-summary">
              <h2 className="summary-title">Today's Nutrition</h2>
              <div className="nutrient-bars">
                {Object.entries(calculateDailyNeeds()).map(
                  ([nutrient, target]) => {
                    const current =
                      todayNutrition[
                        `total${
                          nutrient.charAt(0).toUpperCase() + nutrient.slice(1)
                        }` as keyof NutritionSummary
                      ];
                    const percentage = (current / target) * 100;
                    const isLow = percentage < 80;

                    return (
                      <div
                        key={nutrient}
                        className={`nutrient-bar ${isLow ? "warning" : ""}`}
                      >
                        <div className="nutrient-label">
                          {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="nutrient-values">
                          {current.toFixed(1)} / {target}g
                        </div>
                        {isLow && (
                          <div className="warning-text">Low intake!</div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Front;
