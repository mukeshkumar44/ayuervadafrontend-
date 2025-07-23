import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const products = [
    {
      title: "Ayurvedic Powder",
      description: "Special powder made from natural herbs",
      image: "https://th.bing.com/th/id/OIP.9cOkdZ1S_bZY6229I5U66wHaEc?w=300&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
    },
    {
      title: "Herbal Oil",
      description: "Pure organic oil",
      image: "https://th.bing.com/th/id/OIP.JnHUGubjiEYLjjhC5xotIAHaD4?w=339&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
    },
    {
      title: "Ayurvedic Kadha",
      description: "Immunity booster herbal drink",
      image: "https://th.bing.com/th/id/OIP.L7fD3Hjav2SsPGRnw5vXuAHaDd?w=333&h=163&c=7&r=0&o=5&dpr=1.3&pid=1.7"
    }
  ];

  return (
    <div className="min-h-screen bg-sage-50">
      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to the World of Ayurveda</h1>
          <p className="text-xl mb-8">Experience the benefits of ancient Indian medicine</p>
          <Link 
            to="/products" 
            className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50"
          >
            View Products
          </Link>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <img 
                src={product.image} 
                alt={product.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-emerald-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Benefits of Ayurveda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Natural Treatment</h3>
              <p>Products made from 100% natural herbs</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">No Side Effects</h3>
              <p>Completely safe with zero side effects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-8">Contact Us</h2>
        <p className="text-xl mb-8">Get in touch with us for any information</p>
        <Link 
          to="/contact" 
          className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
};

export default Home;