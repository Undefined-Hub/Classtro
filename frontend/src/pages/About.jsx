import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Target,
  Zap,
  Award,
  MessageSquare,
  BarChart3,
  QrCode,
  CheckCircle,
  ArrowRight,
  Mail,
  Linkedin,
  Github,
  Globe,
  Heart,
  TrendingUp,
  Clock,
  Shield
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const About = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const stats = [
    { icon: Users, value: "10K+", label: "Active Users", color: "blue" },
    { icon: TrendingUp, value: "50K+", label: "Sessions Hosted", color: "green" },
    { icon: Clock, value: "99.9%", label: "Uptime", color: "purple" },
    { icon: Heart, value: "4.8/5", label: "User Rating", color: "red" }
  ];

  const features = [
    {
      icon: QrCode,
      title: "QR Code Joining",
      description: "Students can join sessions instantly by scanning QR codes - no more manual entry or confusion.",
      color: "blue"
    },
    {
      icon: MessageSquare,
      title: "Live Q&A",
      description: "Real-time question submission and upvoting system to prioritize the most important queries.",
      color: "green"
    },
    {
      icon: BarChart3,
      title: "Live Polls",
      description: "Create interactive polls during sessions to gauge understanding and keep students engaged.",
      color: "purple"
    },
    {
      icon: Award,
      title: "Analytics Dashboard",
      description: "Comprehensive insights into attendance, participation, and engagement metrics.",
      color: "orange"
    },
    {
      icon: Shield,
      title: "Session Feedback",
      description: "Collect student feedback with ratings and comments to continuously improve teaching methods.",
      color: "indigo"
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Socket-based live updates ensure everyone stays synchronized during active sessions.",
      color: "yellow"
    }
  ];

  const team = [
    {
      name: "Team Undefined",
      role: "Development Team",
      email: "official.team.undefined@gmail.com",
      bio: "Passionate developers building the future of classroom engagement",
      avatar: "U!",
      color: "bg-gradient-to-br from-blue-600 to-blue-800"
    }
  ];

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To revolutionize classroom engagement by providing educators with powerful, easy-to-use tools that foster real-time interaction and meaningful participation."
    },
    {
      icon: Users,
      title: "Our Vision",
      description: "A world where every classroom session is interactive, engaging, and data-driven, empowering both teachers and students to achieve their full potential."
    },
    {
      icon: Zap,
      title: "Our Values",
      description: "Innovation, accessibility, and user-centric design drive everything we do. We believe in building tools that make a real difference in education."
    }
  ];

  const milestones = [
    { year: "2024", event: "Classtro Platform Launched", icon: CheckCircle },
    { year: "2024", event: "Reached 1,000+ Users", icon: Users },
    { year: "2024", event: "Session Feedback System", icon: MessageSquare },
    { year: "2025", event: "10K+ Active Users", icon: Award }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "from-blue-500 to-blue-600 hover:shadow-blue-500/50",
      green: "from-green-500 to-green-600 hover:shadow-green-500/50",
      purple: "from-purple-500 to-purple-600 hover:shadow-purple-500/50",
      orange: "from-orange-500 to-orange-600 hover:shadow-orange-500/50",
      indigo: "from-indigo-500 to-indigo-600 hover:shadow-indigo-500/50",
      yellow: "from-yellow-500 to-yellow-600 hover:shadow-yellow-500/50",
      red: "from-red-500 to-red-600 hover:shadow-red-500/50"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 opacity-70"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6">
            About{" "}
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 bg-clip-text text-transparent">
              Classtro
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Empowering educators with real-time classroom engagement tools. Transform traditional sessions into interactive learning experiences.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${getColorClasses(stat.color)} mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Drives Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our core principles that shape everything we build
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to create engaging classroom experiences
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isHovered = hoveredCard === index;
              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 transition-all duration-300 cursor-pointer ${
                    isHovered ? "shadow-2xl -translate-y-2" : "shadow-md"
                  }`}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${getColorClasses(feature.color)} mb-4 transition-transform duration-300 ${
                    isHovered ? "scale-110" : ""
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Key milestones in our mission to transform education
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700"></div>
            <div className="space-y-8">
              {milestones.map((milestone, index) => {
                const Icon = milestone.icon;
                return (
                  <div key={index} className="relative flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <span className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold mb-2">
                        {milestone.year}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {milestone.event}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section> */}

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet The Team
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The passionate minds behind Classtro
            </p>
          </div>
          <div className="flex justify-center">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 max-w-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-32 h-32 rounded-full ${member.color} flex items-center justify-center text-white text-4xl font-bold mb-6 shadow-lg`}>
                    {member.avatar}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {member.name}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold mb-4">
                    {member.role}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                    {member.bio}
                  </p>
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <Mail className="w-5 h-5" />
                    Contact Us
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of educators who are already using Classtro to create engaging learning experiences.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            Get Started Today
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
