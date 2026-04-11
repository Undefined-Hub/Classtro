import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");

  const plans = [
    {
      name: "Free",
      price: { monthly: 0, annual: 0 },
      description: "For individual educators",
      features: [
        "Unlimited sessions",
        "QR code joining",
        "Live Q&A and polls",
        "Basic analytics",
        "Session feedback",
        "Up to 50 participants",
        "5 rooms per account",
        "Community support",
      ],
      cta: "Get started for free",
      ctaLink: "/register",
      popular: false,
      buttonStyle:
        "border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
    },
    {
      name: "Pro",
      price: { monthly: 499, annual: 4990 },
      description: "Great for small institutions",
      features: [
        "Everything in Free",
        "Up to 200 participants",
        "Advanced analytics & insights",
        "Priority support",
        "Custom branding",
        "Unlimited rooms",
        "Export session data",
        "Attendance reports",
      ],
      cta: "Get started with Pro",
      ctaLink: "/register",
      popular: true,
      buttonStyle: "bg-blue-700 text-white hover:bg-blue-800",
    },
    {
      name: "Enterprise",
      price: { monthly: "Custom", annual: "Custom" },
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Unlimited participants",
        "Dedicated account manager",
        "SSO & advanced security",
        "API access",
        "Custom integrations",
        "SLA & 24/7 support",
        "On-premise deployment",
      ],
      cta: "Contact sales",
      ctaLink: "/contact",
      popular: false,
      buttonStyle: "bg-white text-gray-900 hover:bg-gray-100",
      isDark: true,
    },
  ];

  const getPrice = (plan) => {
    if (plan.price.monthly === "Custom") return "Custom";
    const price =
      billingCycle === "monthly" ? plan.price.monthly : plan.price.annual;
    return `₹${price}`;
  };

  const getPriceSubtext = (plan) => {
    if (plan.price.monthly === "Custom")
      return "Per organization, billed annually";
    return billingCycle === "monthly"
      ? "Per month, billed monthly"
      : "Per year, billed annually";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Plans and Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Receive unlimited credits when you pay yearly, and save on your
            plan.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                billingCycle === "annual"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.isDark
                  ? "bg-gray-900 dark:bg-gray-800 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              } ${plan.popular ? "ring-2 ring-blue-600" : ""} transition-all duration-300 hover:shadow-xl`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold">
                    <Sparkles className="w-3 h-3" />
                    Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-2 ${plan.isDark ? "text-white" : "text-gray-900 dark:text-white"}`}
                >
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span
                    className={`text-4xl font-bold ${plan.isDark ? "text-white" : "text-gray-900 dark:text-white"}`}
                  >
                    {getPrice(plan)}
                  </span>
                </div>
                <p
                  className={`text-sm ${plan.isDark ? "text-gray-400" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {getPriceSubtext(plan)}
                </p>
              </div>

              <p
                className={`mb-6 text-sm ${plan.isDark ? "text-gray-300" : "text-gray-700 dark:text-gray-300"}`}
              >
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        plan.isDark
                          ? "text-white"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    />
                    <span
                      className={`text-sm ${plan.isDark ? "text-gray-300" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.ctaLink}
                className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${plan.buttonStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
