import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "./FoodEntryList.css";

type FoodEntry = {
  id: number;
  name: string;
  portion: number;
  unit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  meal_type: string;
  consumed_at: string;
};
dayjs.extend(utc);

const FoodEntryList = () => {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login.");
      window.location.href = "/login";
      return;
    }
    fetch("/api/get-food-entry-user-details", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch(() => alert("Failed to fetch food entries."));
  }, [navigate]);

  return (
    <div className="food-entry-list-wrapper">
      <h2 className="food-entry-title">🍽️ Your Food Entries</h2>
      <div className="entries-list">
        {entries.length === 0 ? (
          <p className="no-entries-msg">
            No entries found. Start adding your meals! 🥗
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="entry-card">
              <h4>
                {entry.name}{" "}
                <span className="meal-tag">({entry.meal_type})</span>
              </h4>
              <div className="nutrition-details">
                <p>
                  <strong>Portion:</strong> {entry.portion} {entry.unit}
                </p>
                <p>
                  <strong>Calories:</strong> {entry.calories} kcal
                </p>
                <p>
                  <strong>Protein:</strong> {entry.protein}g
                </p>
                <p>
                  <strong>Carbs:</strong> {entry.carbohydrates}g
                </p>
                <p>
                  <strong>Fat:</strong> {entry.fat}g
                </p>
                <p>
                  <strong>Fiber:</strong> {entry.fiber}g
                </p>
                <p>
                  <strong>Sugar:</strong> {entry.sugar}g
                </p>
                <p>
                  <strong>Consumed At:</strong>{" "}
                  {dayjs(entry.consumed_at).utc().format("M/D/YYYY, h:mm A")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FoodEntryList;
