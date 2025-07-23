import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

const products = [
  { id: 1,  image: "https://www.pravek.com/cdn/shop/files/Ashwagandha_-_Desktop_banner.jpg?v=1739853450&width=1920" },
  { id: 2,  image: "https://www.pravek.com/cdn/shop/files/Rajatprash_-_Desktop_Banner_23ab3f25-ff11-4582-a2a9-344b41ce100c.jpg?v=1739434793&width=1920" },
  { id: 3,   image: "https://www.pravek.com/cdn/shop/files/Netramrit_-_Desktop_banner_1.jpg?v=1738658193&width=1920" },
  { id: 4, image: "https://www.pravek.com/cdn/shop/files/Pravekliv_-_Desktop_banner.jpg?v=1738133444&width=1920" },
  { id: 5,  image: "https://www.pravek.com/cdn/shop/files/Ashwagandha_-_Desktop_banner.jpg?v=1739853450&width=1920" },
];

const ProductSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const totalSlides = products.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (!autoScroll) return;
    const interval = setInterval(nextSlide, 3000);
    return () => clearInterval(interval);
  }, [autoScroll, nextSlide]);

  return (
    <div className="p-6 bg-green-50 shadow-md rounded-xl w-full mx-auto  overflow-hidden relative mt-16">

      {/* Product Slider */}
      <div 
        className="cursor-grab overflow-hidden w-full flex justify-center items-center" 
        onMouseEnter={() => setAutoScroll(false)}
        onMouseLeave={() => setAutoScroll(true)}
      >
        <motion.div
          key={products[currentIndex].id}
          className="w-full bg-gray-100 p-6 rounded-lg shadow-lg text-center"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          {/* Offer Badge */}
         

          <img src={products[currentIndex].image} alt={products[currentIndex].name} className="w-full h-[550px] object-cover rounded-lg" />

          

          {/* Star Rating */}
          <div className="flex justify-center items-center mt-2">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`text-yellow-400 ${i < Math.round(products[currentIndex].rating) ? "fill-current" : "opacity-50"}`}>
                
              </span>
            ))}
            
          </div>
        </motion.div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-4">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <span
            key={index}
            className={`h-3 w-3 mx-1 rounded-full cursor-pointer ${currentIndex === index ? "bg-green-600" : "bg-gray-400"}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductSlider;
