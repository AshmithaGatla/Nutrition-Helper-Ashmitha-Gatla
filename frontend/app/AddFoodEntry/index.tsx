import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./AddFoodEntry.css";

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // months are 0-indexed
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AddFoodEntry = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log("Token is", storedToken);
    setToken(storedToken);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    portion: "",
    unit: "grams",
    calories: "",
    protein: "",
    carbohydrates: "",
    fat: "",
    fiber: "",
    sugar: "",
    meal_type: "breakfast",
    date: "",
    time: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { date, time, ...rest } = formData;
    const consumed_at = `${date}T${time}:00`;

    const payload = {
      ...rest,
      portion: Number(rest.portion),
      calories: Number(rest.calories),
      protein: Number(rest.protein),
      carbohydrates: Number(rest.carbohydrates),
      fat: Number(rest.fat),
      fiber: Number(rest.fiber),
      sugar: Number(rest.sugar),
      consumed_at,
    };

    try {
      const response = await fetch("/api/food-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      alert(data.message);
      if (response.ok) window.location.href = "/";
    } catch (e) {
      alert("Error submitting entry. Please try again.");
    }
  };

  const timeOptions = [
    "00:00",
    "00:30",
    "01:00",
    "01:30",
    "02:00",
    "02:30",
    "03:00",
    "03:30",
    "04:00",
    "04:30",
    "05:00",
    "05:30",
    "06:00",
    "06:30",
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
    "22:30",
    "23:00",
    "23:30",
  ];

  return (
    <div className="food-entry-page">
      <div className="form-container">
        <h2 className="form-title">🍽️ Add Food Entry</h2>
        <form onSubmit={handleSubmit} className="food-entry-form">
          <div className="input-group">
            <label>Food Name:</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Portion:</label>
            <input
              name="portion"
              type="number"
              value={formData.portion}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Unit:</label>
            <input name="unit" value="grams" disabled />
          </div>
          <div className="input-group">
            <label>Meal Type:</label>
            <select
              name="meal_type"
              value={formData.meal_type}
              onChange={handleChange}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div className="input-group">
            <label>Calories (kcal):</label>
            <input
              name="calories"
              type="number"
              value={formData.calories}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Protein (g):</label>
            <input
              name="protein"
              type="number"
              value={formData.protein}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Carbs (g):</label>
            <input
              name="carbohydrates"
              type="number"
              value={formData.carbohydrates}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Fat (g):</label>
            <input
              name="fat"
              type="number"
              value={formData.fat}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Fiber (g):</label>
            <input
              name="fiber"
              type="number"
              value={formData.fiber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Sugar (g):</label>
            <input
              name="sugar"
              type="number"
              value={formData.sugar}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Date:</label>
            <input
              name="date"
              type="date"
              max={getTodayDate()} // Local/system date
              //max={new Date().toISOString().split("T")[0]} // This disables dates after today
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label>Time (24hrs):</label>
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            >
              <option value="">Select Time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
          <div className="button-group">
            <button type="submit" className="submit-btn">
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFoodEntry;
