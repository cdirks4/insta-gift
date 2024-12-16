"use client";

import Image from "next/image";
import {
  Camera,
  User,
  DollarSign,
  Sparkles,
  Gift,
  Instagram,
  Heart,
  Palette,
  Dumbbell,
  Laptop,
  Cake,
  Tag,
  AlertCircle,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import Snowflakes from "@/components/Snowflakes";
import { sampleProfiles } from "@/data/examples";

interface GiftRecommendation {
  name: string;
  price: number;
  description: string;
  match_reason: string;
  amazon_link?: string;
  etsy_link?: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<GiftRecommendation[]>(
    []
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [inputMethod, setInputMethod] = useState<"image" | "username">("image");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (inputMethod === "username" && username) {
        // Handle username-based analysis
        const response = await fetch("/api/instagram", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch Instagram data");
        }

        const data = await response.json();
        // Use the profile data for recommendations
        const formData = new FormData();
        formData.append("age", e.currentTarget.age.value);
        formData.append("budget", e.currentTarget.budget.value);
        formData.append("profile_data", JSON.stringify(data.profile));

        const giftResponse = await fetch("/api/gifts", {
          method: "POST",
          body: formData,
        });

        if (!giftResponse.ok) {
          throw new Error("Failed to get recommendations");
        }

        const giftData = await giftResponse.json();
        setRecommendations(giftData.recommendations);
      } else {
        // Existing image-based analysis
        const formData = new FormData(e.currentTarget);
        const response = await fetch("/api/gifts", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to get recommendations");
        }

        const data = await response.json();
        setRecommendations(data.recommendations);
      }

      // Scroll to results
      document.getElementById("results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } catch (error) {
      setError("Failed to get gift recommendations. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (profile: (typeof sampleProfiles)[0]) => {
    const formData = new FormData();
    formData.append("age", profile.age.toString());
    formData.append("budget", profile.budget.toString());
    formData.append("interests", profile.interests.join(", "));

    handleSubmit({
      preventDefault: () => {},
      currentTarget: { formData },
    } as any);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-holiday-red/5 to-holiday-green/5">
      {/* Background Elements */}
      <div className="winter-background" />
      <div className="winter-overlay" />
      <div id="snowflakes" className="fixed inset-0 pointer-events-none z-10" />
      <Snowflakes />

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border-2 border-holiday-red transform hover:scale-[1.02] transition-all">
            <h1 className="text-6xl sm:text-7xl font-bold mb-6 bg-gradient-to-r from-holiday-red to-holiday-green bg-clip-text text-transparent">
              InstaGift 🎁
            </h1>
            <p className="text-2xl sm:text-3xl text-gray-700 mb-6">
              Find the Perfect Holiday Gift with AI Magic ✨
            </p>
            <div className="flex justify-center gap-4 text-4xl animate-bounce">
              🎄 🎅 🎁
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-center mb-12 text-holiday-red">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Camera,
                number: "1",
                title: "Upload Instagram Grid",
                desc: "Share their Instagram profile screenshot",
              },
              {
                icon: User,
                number: "2",
                title: "Add Details",
                desc: "Tell us their age and interests",
              },
              {
                icon: DollarSign,
                number: "3",
                title: "Set Budget",
                desc: "Choose your spending limit",
              },
              {
                icon: Gift,
                number: "4",
                title: "Get Recommendations",
                desc: "Let our holiday elves work their magic!",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="relative p-8 rounded-xl border-2 border-holiday-green bg-white/95 backdrop-blur-sm shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="absolute -top-5 -left-5 w-10 h-10 bg-holiday-red text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                  {step.number}
                </div>
                <div className="flex flex-col items-center text-center">
                  <step.icon className="w-16 h-16 text-holiday-gold mb-6" />
                  <h3 className="text-2xl font-bold mb-4 text-holiday-green">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-lg">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample Profiles */}
        <section className="mb-16 p-8 border-2 border-dashed border-holiday-red rounded-xl relative">
          <span className="absolute -top-4 left-8 bg-white px-4 text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-holiday-red" />
            Sample Profiles
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sampleProfiles.map((profile) => (
              <div
                key={profile.name}
                className="bg-white rounded-xl p-4 shadow-md hover:transform hover:scale-105 transition-transform border-2 border-holiday-green group cursor-pointer"
                onClick={() => handleExampleClick(profile)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-6 h-6 text-holiday-gold" />
                  <h4 className="text-xl font-bold">{profile.name}</h4>
                </div>
                <p className="text-gray-600 mb-4">{profile.desc}</p>
                <div className="relative h-64 rounded-lg overflow-hidden group-hover:shadow-lg transition-shadow">
                  <Image
                    src={profile.img}
                    alt={`${profile.name}'s profile`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-lg font-bold mb-2">
                      Try this example
                    </p>
                    <div className="text-white/80">
                      <p>Age: {profile.age}</p>
                      <p>Budget: ${profile.budget}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Form Section */}
        <section className="max-w-2xl mx-auto px-4 pb-20">
          <form
            onSubmit={handleSubmit}
            className="space-y-8 bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl border-2 border-holiday-green"
          >
            <h2 className="text-2xl font-bold text-center text-holiday-green mb-8">
              Santa's Gift Finder 🎅
            </h2>

            {/* Age Input */}
            <div className="space-y-2">
              <label className="flex items-center text-lg font-medium text-gray-700">
                <Gift className="w-5 h-5 mr-2 text-holiday-red" />
                Who's Been Nice? (Age)
              </label>
              <input
                type="number"
                name="age"
                required
                min="1"
                max="120"
                className="w-full px-4 py-3 rounded-lg border-2 border-holiday-red/50 focus:border-holiday-red focus:ring-2 focus:ring-holiday-red/30"
                placeholder="Enter age"
              />
            </div>

            {/* Budget Input */}
            <div className="space-y-2">
              <label className="flex items-center text-lg font-medium text-gray-700">
                <DollarSign className="w-5 h-5 mr-2 text-holiday-green" />
                Holiday Budget
              </label>
              <input
                type="number"
                name="budget"
                required
                min="1"
                className="w-full px-4 py-3 rounded-lg border-2 border-holiday-green/50 focus:border-holiday-green focus:ring-2 focus:ring-holiday-green/30"
                placeholder="Enter budget in USD"
              />
            </div>

            {/* Interests Input */}
            <div className="space-y-2">
              <label className="flex items-center text-lg font-medium text-gray-700">
                <Heart className="w-5 h-5 mr-2 text-holiday-red" />
                Holiday Wishes (Interests)
              </label>
              <textarea
                name="interests"
                className="w-full px-4 py-3 rounded-lg border-2 border-holiday-red/50 focus:border-holiday-red focus:ring-2 focus:ring-holiday-red/30"
                placeholder="What brings them joy? (separated by commas)"
                rows={3}
              />
            </div>

            {/* Input Method Toggle */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                type="button"
                onClick={() => setInputMethod("image")}
                className={`px-4 py-2 rounded-lg ${
                  inputMethod === "image"
                    ? "bg-holiday-green text-white"
                    : "bg-gray-200"
                }`}
              >
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => setInputMethod("username")}
                className={`px-4 py-2 rounded-lg ${
                  inputMethod === "username"
                    ? "bg-holiday-green text-white"
                    : "bg-gray-200"
                }`}
              >
                Enter Username
              </button>
            </div>

            {inputMethod === "username" ? (
              <div className="space-y-2">
                <label className="flex items-center text-lg font-medium text-gray-700">
                  <Instagram className="w-5 h-5 mr-2 text-holiday-red" />
                  Instagram Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-holiday-red/50 focus:border-holiday-red focus:ring-2 focus:ring-holiday-red/30"
                  placeholder="Enter Instagram username"
                />
              </div>
            ) : (
              // Existing image upload input
              <div className="space-y-2">
                <label className="flex items-center text-lg font-medium text-gray-700">
                  <Camera className="w-5 h-5 mr-2 text-holiday-green" />
                  Instagram Memories (Optional)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    name="instagram-grid"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full px-4 py-3 rounded-lg border-2 border-dashed border-holiday-green/50 hover:border-holiday-green cursor-pointer bg-white/50 hover:bg-white/80 transition-all"
                  >
                    {previewUrl ? (
                      <div className="relative w-full aspect-square max-w-xs mx-auto">
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-500">
                        Share their Instagram moments
                      </span>
                    )}
                  </label>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 bg-gradient-to-r from-holiday-red to-holiday-green text-white rounded-lg font-bold hover:opacity-90 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Checking Santa's List...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Find Holiday Magic
                </span>
              )}
            </button>
          </form>
        </section>

        {/* Results Section */}
        {recommendations.length > 0 && (
          <section id="results" className="max-w-6xl mx-auto px-4 pb-20">
            <h2 className="text-4xl font-bold text-center mb-12 text-holiday-red">
              🎄 Santa's Suggestions ��
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendations.map((gift, index) => (
                <div
                  key={index}
                  className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-all duration-300 border-2 border-holiday-green"
                >
                  <div className="p-6 space-y-4">
                    <div className="text-2xl font-bold text-holiday-red mb-2">
                      {gift.name}
                    </div>
                    <p className="text-gray-700">{gift.description}</p>
                    <div className="flex items-center text-holiday-green font-bold text-xl">
                      <DollarSign className="w-5 h-5 mr-1" />
                      {gift.price.toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      <Tag className="w-4 h-4 inline mr-1" />
                      {gift.match_reason}
                    </p>
                    <div className="flex space-x-4 pt-4">
                      {gift.amazon_link && (
                        <a
                          href={gift.amazon_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center py-2 px-4 bg-holiday-gold text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Amazon
                        </a>
                      )}
                      {gift.etsy_link && (
                        <a
                          href={gift.etsy_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center py-2 px-4 bg-holiday-red text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Etsy
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-holiday-red text-red-700 p-4 rounded-lg shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
