import React from "react";
import { Link } from "react-router-dom";
import { Check, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Simple, Transparent{" "}
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white font-semibold mb-4">
                <Zap className="w-5 h-5" />
                Free
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                $0 / month
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                All features included, no credit card required
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Unlimited sessions",
                "QR code joining",
                "Live Q&A and polls",
                "Real-time analytics",
                "Session feedback",
                "Attendance tracking",
                "Multi-room support",
                "24/7 support"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Get Started Now
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-600 dark:text-gray-400 mt-8">
            Have questions? <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact us</Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
