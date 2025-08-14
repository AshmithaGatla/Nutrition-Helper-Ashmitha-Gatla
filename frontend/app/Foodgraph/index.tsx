import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "./FoodGraph.css"; // Importing the new CSS file for styling

dayjs.extend(utc);

interface FoodEntry {
  food_name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  sugar: number;
  consumed_at: string;
}

interface AggregatedData {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  fiber: number;
  sugar: number;
}

const FoodLineGraph = () => {
  const [data, setData] = useState<AggregatedData[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }

      try {
        const response = await fetch("/api/get-food-entry-user-details", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch food entries");
          return;
        }

        const rawData: FoodEntry[] = await response.json();
        const now = dayjs();
        const startOfMonth = now.startOf("month").format("YYYY-MM-DD");
        const endOfMonth = now.endOf("month").format("YYYY-MM-DD");

        const dailyTotals: { [date: string]: AggregatedData } = {};

        rawData.forEach((entry) => {
          // Use utc() to avoid time zone conversion
          const dateObj = dayjs.utc(entry.consumed_at).format("YYYY-MM-DD"); // Treat as UTC and only use date
          if (dateObj < startOfMonth || dateObj > endOfMonth) return;

          if (!dailyTotals[dateObj]) {
            dailyTotals[dateObj] = {
              date: dateObj,
              calories: 0,
              protein: 0,
              fat: 0,
              carbohydrates: 0,
              fiber: 0,
              sugar: 0,
            };
          }

          dailyTotals[dateObj].calories += entry.calories;
          dailyTotals[dateObj].protein += entry.protein;
          dailyTotals[dateObj].fat += entry.fat;
          dailyTotals[dateObj].carbohydrates += entry.carbohydrates;
          dailyTotals[dateObj].fiber += entry.fiber;
          dailyTotals[dateObj].sugar += entry.sugar;
        });

        // Fill missing days
        const daysInMonth = dayjs(endOfMonth).date();
        const fullData: AggregatedData[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = dayjs(startOfMonth).date(day).format("YYYY-MM-DD");
          fullData.push(
            dailyTotals[date] || {
              date,
              calories: 0,
              protein: 0,
              fat: 0,
              carbohydrates: 0,
              fiber: 0,
              sugar: 0,
            }
          );
        }

        setData(fullData);
      } catch (err) {
        console.error("Error fetching food data:", err);
      }
    };

    fetchData();
  }, []);

  const currentMonth = dayjs().format("MMMM YYYY");

  return (
    <div className="food-line-graph-container">
      <h2 className="graph-title">Nutrition Overview - {currentMonth}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="calories" stroke="#ff7300" />
          <Line type="monotone" dataKey="protein" stroke="#387908" />
          <Line type="monotone" dataKey="fat" stroke="#8884d8" />
          <Line type="monotone" dataKey="carbohydrates" stroke="#0088FE" />
          <Line type="monotone" dataKey="fiber" stroke="#00C49F" />
          <Line type="monotone" dataKey="sugar" stroke="#FFBB28" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FoodLineGraph;
