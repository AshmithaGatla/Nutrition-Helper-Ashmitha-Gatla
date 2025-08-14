import React, { useState } from "react";
import "./FilteredFoodEntries.css";

interface FoodEntry {
  name: string;
  portion: number;
  unit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  consumed_at: string;
  meal_type: string;
}

const FilteredFoodEntries = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [error, setError] = useState("");

  const handleFilter = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      return;
    }

    // Validate date range
    if (!fromDate || !toDate) {
      setError("Please select both dates.");
      return;
    }

    try {
      const response = await fetch("/api/filter-food-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ from_date: fromDate, to_date: toDate }),
      });

      if (!response.ok) {
        const data = await response.text();
        setError(data || "Failed to fetch data");
        return;
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        setEntries([]);
        setError("No records found for selected dates.");
      } else {
        setEntries(data);
        setError("");
      }
    } catch (err) {
      setError("Error fetching data");
    }
  };
  return (
    <div className="filter-container">
      <h2 className="food-entry-title">Filter Food Entries</h2>
      <div className="date-inputs">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </div>
      <button onClick={handleFilter}>Get Entries</button>

      {error && <p className="error-message">{error}</p>}

      <ul>
        {entries.map((entry, index) => (
          <li key={index}>
            <strong>{entry.consumed_at.slice(0, 10)}</strong>
            <strong>{entry.name}</strong>
            <br />
            Portion: {entry.portion} {entry.unit}
            <br />
            Calories: {entry.calories} kcal
            <br />
            Protein: {entry.protein} g<br />
            Carbohydrates: {entry.carbohydrates} g<br />
            Fat: {entry.fat} g<br />
            Fiber: {entry.fiber} g<br />
            Sugar: {entry.sugar} g<br />
            Meal Type: {entry.meal_type}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FilteredFoodEntries;
