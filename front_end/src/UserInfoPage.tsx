import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export function UserInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const [disability, setDisability] = useState("");
  const [age, setAge] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    return <p>Error: User ID not found.</p>;
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
        { disability, age },
        { merge: true }
      );
      setLoading(false);
      alert("Info saved!");
      navigate("/"); // or dashboard
    } catch (err) {
      console.error(err);
      setError("Failed to save info");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">
          Tell us about yourself
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Disability */}
          <select
            value={disability}
            onChange={(e) => setDisability(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Disability</option>
            <option value="None">None</option>
            <option value="ADHD">ADHD</option>
            <option value="Dyslexia">Dyslexia</option>
            <option value="Visual">Visual Impairment</option>
          </select>

          {/* Age */}
          <input
            type="number"
            placeholder="Enter your age"
            value={age}
            onChange={(e) =>
              setAge(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            min={0}
            max={120}
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
