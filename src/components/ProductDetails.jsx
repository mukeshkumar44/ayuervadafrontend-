import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keep token state in sync with localStorage
  useEffect(() => {
    const refreshToken = () => {
      const token = getToken();
      if (!token) {
        localStorage.removeItem('token');
      }
    };
    
    // Listen for storage events (like token changes)
    window.addEventListener('storage', refreshToken);
    
    // Refresh token when component mounts
    refreshToken();
    
    return () => {
      window.removeEventListener('storage', refreshToken);
    };
  }, []);

  // Fetch product and similar products
  const fetchProducts = async () => {
    try {
      const response = await fetch('https://expressjs-zpto.onrender.com/api/home_Products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
        const currentProduct = data.products.find(p => p._id === id);
        setProduct(currentProduct);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Failed to load product details');
      setLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const response = await fetch(`https://expressjs-zpto.onrender.com/api/products/${id}/reviews`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // If no reviews found, just set empty array
          setReviews([]);
          return;
        }
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Don't show error toast for 404
      if (!error.message.includes('404')) {
        toast.error('Failed to load reviews');
      }
      setReviews([]);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProducts();
      fetchReviews();
    }
  }, [id]);

  const handleAddToCart = async (product) => {
    try {
        // Get existing cart items from localStorage
        let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        
        // Check if product already exists in cart
        const existingItemIndex = cartItems.findIndex(item => item._id === product._id);
        
        if (existingItemIndex !== -1) {
            // If product exists, increase quantity
            cartItems[existingItemIndex].quantity += 1;
            toast.success('Item quantity updated in cart');
        } else {
            // If product doesn't exist, add new item
            cartItems.push({
                _id: product._id,
                name: product.name,
                price: product.price,
                imageurl: product.imageurl,
                quantity: 1
            });
            toast.success('Added to cart');
        }
        
        // Save updated cart to localStorage
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));

    } catch (error) {
        console.error('Add to cart error:', error);
        toast.error('Error adding to cart');
    }
  };

  const handleReviewSubmit = async (e, formData = null) => {
    e.preventDefault();
    
    // Use either form data passed from the child component or the main component state
    const rating = formData ? formData.rating : userRating;
    const comment = formData ? formData.comment : userReview;
    
    // Check if user exists in context
    if (!user) {
      toast.error('Please login to add a review');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    // Check if user ID exists
    if (!user._id) {
      toast.error('User profile incomplete. Please logout and login again.');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    // Get the fresh token directly from AuthContext
    const token = getToken();
    if (!token) {
      toast.error('Your session appears to have expired. Please login again.');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment || !comment.trim()) {
      toast.error('Please add a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a clean review object
      const reviewData = {
        rating: parseInt(rating),
        comment: comment.trim()
      };
      
      console.log('Submitting review with data:', {
        productId: id,
        ...reviewData
      });
      
      // Log current authentication state for debugging
      console.log('Auth State:', { 
        isLoggedIn: !!user, 
        userId: user?._id,
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 5) : null
      });
      
      const response = await fetch(`https://expressjs-zpto.onrender.com/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      console.log('Review submission response status:', response.status);
      
      // Try to parse response as JSON, but handle case where it's not valid JSON
      let responseData = {};
      try {
        responseData = await response.json();
        console.log('Review submission response data:', responseData);
      } catch (jsonError) {
        console.error('Failed to parse response as JSON:', jsonError);
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          toast.error('Session expired. Please login again.');
          navigate('/login', { state: { from: `/product/${id}` } });
          return;
        } else if (response.status === 400) {
          // Validation error or user already reviewed
          toast.error(responseData.message || 'Invalid review data');
          return;
        } else if (response.status === 500) {
          // Server error
          console.error('Server error details:', responseData.error);
          toast.error('Server error occurred. Please try again later or try refreshing the page.');
          
          // If it's a validation error, we can give more specific feedback
          if (responseData.error && responseData.error.includes('ValidationError')) {
            toast.error('There was an issue with your review. Please try logging out and back in.');
          }
          return;
        }
        throw new Error(responseData.message || `Failed to add review (Status: ${response.status})`);
      }

      toast.success('Review added successfully!');
      
      // Reset both the main component state and the form component will reset on re-render
      setUserRating(0);
      setUserReview('');
      
      fetchReviews(); // Refresh reviews
    } catch (error) {
      console.error('Error adding review:', error);
      toast.error(error.message || 'Failed to add review. Please try logging out and back in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      toast.error('Please login to mark review as helpful');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error('Please login to mark review as helpful');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    try {
      const response = await fetch(
        `https://expressjs-zpto.onrender.com/api/products/${id}/reviews/${reviewId}/helpful`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Token expired or invalid
          toast.error('Session expired. Please login again.');
          navigate('/login', { state: { from: `/product/${id}` } });
          return;
        }
        throw new Error(errorData.message || 'Failed to mark review as helpful');
      }

      const data = await response.json();
      toast.success('Review marked as helpful');
      fetchReviews(); // Refresh reviews
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      toast.error(error.message || 'Failed to mark review as helpful');
    }
  };

  const handleBuyNow = () => {
    const token = getToken();
    const userProfile = localStorage.getItem('userProfile');

    if (!token || !userProfile) {
      toast.error('Please login to continue');
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    try {
      const userData = JSON.parse(userProfile);
      
      // Create single product order
      const buyNowItem = {
        _id: product._id,
        sellerId: product.seller,
        name: product.name,
        price: product.price,
        imageurl: product.imageurl,
        quantity: 1
      };

      // Store buy now item separately from cart
      localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
      
      // Navigate to checkout with buy now flag
      navigate('/checkout', { 
        state: { 
          isBuyNow: true
        }
      });
    } catch (error) {
      console.error('Error processing buy now:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const ReviewForm = () => {
    // Local state for form inputs
    const [reviewText, setReviewText] = useState('');
    const [reviewRating, setReviewRating] = useState(0);
    
    // Handle form submission
    const submitReview = (e) => {
      e.preventDefault();
      
      // Pass the form values to the parent handler
      handleReviewSubmit(e, {
        rating: reviewRating,
        comment: reviewText
      });
    };
    
    return (
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Add Your Review</h3>
        <form onSubmit={submitReview}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <StarRating 
              rating={reviewRating} 
              setRating={setReviewRating}
              size="w-6 h-6"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="4"
              placeholder="Write your review here..."
              required
              minLength="10"
              maxLength="500"
              style={{ resize: 'vertical' }}
            />
            <p className="text-sm text-gray-500 mt-1">
              {reviewText.length}/500 characters
            </p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || reviewRating === 0 || !reviewText.trim()}
            className={`w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors
              ${(isSubmitting || reviewRating === 0 || !reviewText.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    );
  };

  const ReviewsList = () => (
    <div className="space-y-6">
      {reviews.length === 0 ? (
        <p className="text-center text-gray-500">No reviews yet. Be the first to review!</p>
      ) : (
        reviews.map((review) => (
          <div key={review._id} className="border-b pb-6 last:border-b-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="mr-4">
                  <div className="font-semibold">{review.name || 'Anonymous'}</div>
                  <StarRating rating={review.rating} size="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
            <p className="text-gray-700 mt-2">{review.comment}</p>
            <div className="mt-3 flex items-center">
              <button
                onClick={() => handleHelpful(review._id)}
                className="text-sm text-gray-500 hover:text-emerald-600 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                Helpful ({review.helpful?.count || 0})
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const similarProducts = products.filter(p => 
    p.category === product.category && p._id !== product._id
  ).slice(0, 4);

  const addToLocalCart = (product) => {
    try {
      // Get existing cart
      const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
      
      // Check if product already exists
      const existingProduct = existingCart.find(item => item._id === product._id);
      
      if (existingProduct) {
        // If product exists, increase quantity
        existingProduct.quantity = (existingProduct.quantity || 1) + 1;
        localStorage.setItem('cart', JSON.stringify(existingCart));
      } else {
        // If product doesn't exist, add new product
        const newCart = [...existingCart, { ...product, quantity: 1 }];
        localStorage.setItem('cart', JSON.stringify(newCart));
      }
      
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const SimilarProducts = ({ category, currentProductId }) => {
    const [similarProducts, setSimilarProducts] = useState([]);
    const navigate = useNavigate();

    const handleSimilarProductAddToCart = async (product) => {
      try {
        const success = addToLocalCart(product);
        
        if (success) {
          toast.success('Item added to cart successfully');
          // Optional: Trigger cart update if you're maintaining cart state
          // updateCartCount();
        } else {
          toast.error('Failed to add item to cart');
        }
      } catch (error) {
        toast.error('Error adding item to cart');
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {similarProducts.map((product) => (
          <div key={product._id} className="border p-4 rounded-lg">
            <img 
              src={product.imageurl} 
              alt={product.name} 
              className="w-full h-40 object-cover rounded-lg"
            />
            <h3 className="mt-2 font-semibold">{product.name}</h3>
            <p className="text-emerald-600 font-bold">₹{product.price}</p>
            <button
              onClick={() => handleSimilarProductAddToCart(product)}
              disabled={!product.inStock}
              className="mt-2 w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="bg-white text-center w-48 rounded-2xl h-14 relative text-emerald-600 text-xl font-semibold group mb-6"
          type="button"
        >
          <div className="bg-emerald-400 shadow-xs shadow-black  rounded-xl h-12 w-12 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" height="25px" width="25px">
              <path d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z" fill="#ffffff" />
              <path d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z" fill="#ffffff" />
            </svg>
          </div>
          <p className="translate-x-7 group-hover:translate-x-0 duration-500 text-[17px]">Back To Products</p>
        </button>

        {/* Main Product Details */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <img
                src={product.imageurl}
                alt={product.name}
                className="w-full h-[400px] object-contain rounded-lg"
              />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-emerald-600">
                  ₹{product.price}
                </span>
                {product.originalPrice > product.price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      ₹{product.originalPrice}
                    </span>
                    <span className="text-green-500">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                    </span>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Product Details</h3>
                  <p className="text-gray-600 text-sm">{product.description}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-gray-600 text-sm">Category: {product.category}</p>
                  <p className="text-gray-600 text-sm">
                    Stock: {product.inStock ? (
                      <span className="text-green-600">{product.quantity} units available</span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                    className={`flex-1 px-4 py-3 rounded-lg text-base transition-colors
                      ${product.inStock 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                  
                  <button
                    onClick={handleBuyNow}
                    disabled={!product.inStock}
                    className={`flex-1 px-4 py-3 rounded-lg text-base transition-colors
                      ${product.inStock 
                        ? 'bg-orange-600 text-white hover:bg-orange-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Ratings & Reviews</h2>
          
          {/* Overall Rating Summary */}
          <div className="flex items-center mb-8">
            <div className="text-center mr-8">
              <div className="text-5xl font-bold text-emerald-600">
                {reviews && reviews.length > 0 
                  ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
                  : '0.0'
                }
              </div>
              <StarRating 
                rating={
                  reviews && reviews.length > 0
                    ? Number((reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1))
                    : 0
                } 
                readonly
              />
              <div className="text-sm text-gray-500 mt-1">
                {reviews ? reviews.length : 0} reviews
              </div>
            </div>
          </div>

          {/* Review Form */}
          <ReviewForm />

          {/* Reviews List */}
          <ReviewsList />
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 2 },
                768: { slidesPerView: 3 },
                1024: { slidesPerView: 4 }
              }}
              className="similar-products-slider"
            >
              {similarProducts.map((similarProduct) => (
                <SwiperSlide key={similarProduct._id}>
                  <div
                    className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer h-full"
                    onClick={() => navigate(`/product/${similarProduct._id}`)}
                  >
                    <img
                      src={similarProduct.imageurl}
                      alt={similarProduct.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h4 className="font-semibold mb-2 line-clamp-2">{similarProduct.name}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-emerald-600 font-bold">₹{similarProduct.price}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(similarProduct);
                        }}
                        disabled={!similarProduct.inStock}
                        className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductDetails;