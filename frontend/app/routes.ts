import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("Front/index.tsx"),
  route("login", "Login/index.tsx"),
  route("logout", "Logout/index.tsx"),
  route("forgot-password", "Forgotpassword/index.tsx"),
  route("add-food", "AddFoodEntry/index.tsx"),
  route("get-food", "FoodEntryList/index.tsx"),
  route("linegraph", "Foodgraph/index.tsx"),
  route("food-filter", "Filterfood/index.tsx"),
  route("recommend-recipe", "Recommendrecipies/index.tsx"),
  route("food-info-nutritionix", "FoodNutrition/index.tsx"),
] satisfies RouteConfig;
