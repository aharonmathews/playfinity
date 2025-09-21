import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useUser } from "./contexts/UserContext";

export function UserInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUserData } = useUser();
  const userId = location.state?.userId;
  const [disability, setDisability] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: User ID not found.</p>
          <button
            onClick={() => navigate("/createaccount")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!disability || age === "") {
      setError("Please fill all fields");
      return;
    }
    if (typeof age === "number" && (age < 0 || age > 120)) {
      setError("Enter a valid age");
      return;
    }

    setLoading(true);
    try {
      await setDoc(
        doc(db, "users", userId),
        {
          disability,
          age,
          profileComplete: true,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Fetch updated user data to context
      await fetchUserData(userId);

      // Navigate to home page (root)
      navigate("/");
    } catch (err) {
      console.error("Error saving user info:", err);
      setError("Failed to save info");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="mb-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 text-white grid place-items-center text-xl font-bold shadow-lg">
            U
          </div>
          <h1 className="mt-4 text-2xl font-semibold">
            Tell us about yourself
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This helps us personalize your experience
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="age">
              Age
            </label>
            <input
              id="age"
              type="number"
              placeholder="Enter your age"
              value={age}
              onChange={(e) =>
                setAge(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min={5}
              max={120}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="disability"
            >
              Learning Support Needs
            </label>
            <select
              id="disability"
              value={disability}
              onChange={(e) => setDisability(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select your needs</option>
              <option value="None">No specific needs</option>
              <option value="ADHD">ADHD Support</option>
              <option value="Dyslexia">Dyslexia Support</option>
              <option value="Visual">Visual Impairment</option>
              <option value="Autism">Autism Support</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Complete Profile"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-500 hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
