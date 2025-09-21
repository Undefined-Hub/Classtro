import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from '../components/Hero'
import Details from '../components/Details'

function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Details />
      </main>
      <Footer />
    </div>
  )
}

export default Landing;
