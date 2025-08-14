import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "./RecommendRecipes.css";

interface Recipe {
  title: string;
  image: string;
  nutrition: {
    Calories: number;
    Protein: number;
    Fat: number;
    Carbohydrates: number;
  };
}

interface SuccessModalProps {
  onClose: () => void;
}

interface LoadingModalProps {
  message?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <div className="modal-overlay" />
      <div className="success-modal">
        <div className="checkmark">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeWidth="2" d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <p>Nutrition successfully added!</p>
      </div>
    </>
  );
};

const LoadingModal: React.FC<LoadingModalProps> = ({
  message = "Loading recipes...",
}) => {
  return (
    <>
      <div className="modal-overlay" />
      <div className="loading-modal">
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
    </>
  );
};

const RecommendRecipes = () => {
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbohydrates, setCarbohydrates] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedRecipes, setAddedRecipes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const handleRecommend = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("User not authenticated");
      return;
    }
    if (!calories || !protein || !fat || !carbohydrates) {
      setError("Please fill in all fields to get recipe recommendations.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/recommend-recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          calories: parseFloat(calories),
          protein: parseFloat(protein),
          fat: parseFloat(fat),
          carbohydrates: parseFloat(carbohydrates),
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        setError(message || "Failed to fetch recipes");
        return;
      }

      const data = await response.json();

      if (data.length === 0) {
        setError("No recipes found for the given nutritional values.");
      } else {
        setError("");
      }

      const transformed = data.map((recipe: any) => {
        const nutrients: any = {};
        for (const nutrient of recipe.nutrition.nutrients) {
          nutrients[nutrient.name] = nutrient.amount;
        }

        return {
          title: recipe.title,
          image: recipe.image,
          nutrition: {
            Calories: nutrients["Calories"] ?? 0,
            Protein: nutrients["Protein"] ?? 0,
            Fat: nutrients["Fat"] ?? 0,
            Carbohydrates: nutrients["Carbohydrates"] ?? 0,
          },
        };
      });

      setRecipes(transformed);
    } catch (err) {
      setError("No recipes found for the given nutritional values.");
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    console.log("Token is", storedToken);
    setToken(storedToken);
  }, []);

  const handleAddRecipe = async (e: React.FormEvent, recipe: Recipe) => {
    e.preventDefault();

    const now = new Date();
    const consumed_at = now.toLocaleString();
    console.log(consumed_at);

    const payload = {
      name: recipe.title,
      portion: 100,
      unit: "grams",
      calories: Math.round(recipe.nutrition.Calories),
      protein: Math.round(recipe.nutrition.Protein),
      carbohydrates: Math.round(recipe.nutrition.Carbohydrates),
      fat: Math.round(recipe.nutrition.Fat),
      fiber: 0,
      sugar: 0,
      meal_type: "meal",
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
      if (response.ok) {
        setShowSuccessModal(true);
        setAddedRecipes((prev) => new Set([...prev, recipe.title]));
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 2000);
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert("Error submitting entry. Please try again.");
    }
  };

  return (
    <div className="recommend-container">
      <h2 className="food-entry-title">Recommend Recipes</h2>
      <div className="input-group">
        <input
          type="number"
          placeholder="Calories (Kcal)"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
        <input
          type="number"
          placeholder="Protein (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />
        <input
          type="number"
          placeholder="Fat (g)"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
        />
        <input
          type="number"
          placeholder="Carbohydrates (g)"
          value={carbohydrates}
          onChange={(e) => setCarbohydrates(e.target.value)}
        />
      </div>
      <div className="login-container">
        <button onClick={handleRecommend}>Get Recipes</button>
      </div>

      {error && <p className="error-message">{error}</p>}

      <div className="recipe-list">
        {recipes.map((recipe, index) => {
          const isAdded = addedRecipes.has(recipe.title);
          return (
            <div className="recipe-card" key={index}>
              <img src={recipe.image} alt={recipe.title} />
              <h3>{recipe.title}</h3>
              <p>Calories: {recipe.nutrition.Calories.toFixed(1)} kcal</p>
              <p>Protein: {recipe.nutrition.Protein} g</p>
              <p>Fat: {recipe.nutrition.Fat} g</p>
              <p>Carbs: {recipe.nutrition.Carbohydrates} g</p>
              <button
                className={`add-recipe-btn ${isAdded ? "added" : ""}`}
                onClick={(e) => handleAddRecipe(e, recipe)}
              >
                {isAdded ? "Add Again" : "Add Recipe"}
              </button>
            </div>
          );
        })}
      </div>

      {isLoading && <LoadingModal />}
      {showSuccessModal && (
        <SuccessModal onClose={() => setShowSuccessModal(false)} />
      )}
    </div>
  );
};

export default RecommendRecipes;
