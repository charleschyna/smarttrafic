import React from 'react';
import { 
  MapPin, 
  BarChart3, 
  Route, 
  Brain, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Clock, 
  TrendingUp,
  Play,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain size={24} />,
      title: 'AI-Powered Analytics',
      description: 'Advanced machine learning algorithms predict traffic patterns and optimize routes in real-time.'
    },
    {
      icon: <Route size={24} />,
      title: 'Smart Route Optimization',
      description: 'Find the most efficient routes considering current traffic, road conditions, and historical data.'
    },
    {
      icon: <BarChart3 size={24} />,
      title: 'Predictive Insights',
      description: 'Forecast traffic congestion up to 24 hours ahead with 95% accuracy using AI models.'
    },
    {
      icon: <MapPin size={24} />,
      title: 'Real-time Monitoring',
      description: 'Live traffic data from across Kenyan cities with instant alerts and notifications.'
    }
  ];

  const benefits = [
    'Reduce traffic congestion by up to 35%',
    'Decrease average commute times by 20 minutes',
    'Lower vehicle emissions through optimized routing',
    'Improve emergency response times',
    'Data-driven urban planning decisions',
    'Enhanced public transportation efficiency'
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Mwangi',
      role: 'Urban Planning Director, Nairobi County',
      content: 'MoveSmart KE has revolutionized how we approach traffic management. The AI insights have helped us reduce congestion in the CBD by 30%.',
      avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
    },
    {
      name: 'James Kiprotich',
      role: 'Transport Commissioner, Mombasa',
      content: 'The predictive analytics feature is incredible. We can now anticipate traffic issues before they happen and take proactive measures.',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
    },
    {
      name: 'Grace Wanjiku',
      role: 'Traffic Management Specialist',
      content: 'The scenario simulation tool has been invaluable for planning road closures and events. It saves us countless hours of manual analysis.',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'
    }
  ];

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white mr-3">
                <MapPin size={20} strokeWidth={2} />
              </div>
              <h1 className="text-xl font-bold text-secondary-900">
                MoveSmart <span className="text-primary-500">KE</span>
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-secondary-700 hover:text-primary-600 font-medium">Features</a>
              <a href="#benefits" className="text-secondary-700 hover:text-primary-600 font-medium">Benefits</a>
              <a href="#testimonials" className="text-secondary-700 hover:text-primary-600 font-medium">Testimonials</a>
              <a href="#contact" className="text-secondary-700 hover:text-primary-600 font-medium">Contact</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSignIn}
                className="text-secondary-700 hover:text-primary-600 font-medium"
              >
                Sign In
              </button>
              <button 
                onClick={handleGetStarted}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-6">
                <Brain size={16} className="mr-2" />
                AI-Powered Traffic Intelligence
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-secondary-900 mb-6 leading-tight">
                Optimize Traffic Flow with 
                <span className="text-primary-500"> AI Intelligence</span>
              </h1>
              
              <p className="text-xl text-secondary-600 mb-8 leading-relaxed">
                Transform urban mobility in Kenya with our advanced AI platform. Reduce congestion, 
                improve commute times, and make data-driven decisions for smarter cities.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button 
                  onClick={handleGetStarted}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:shadow-lg flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight size={20} className="ml-2" />
                </button>
                <button className="border border-gray-300 hover:border-primary-300 text-secondary-700 px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:bg-primary-50 flex items-center justify-center">
                  <Play size={20} className="mr-2" />
                  Watch Demo
                </button>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-secondary-600">
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-primary-500 mr-2" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-primary-500 mr-2" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle size={16} className="text-primary-500 mr-2" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg overflow-hidden relative">
                  <div style={{ 
                    backgroundImage: `url(https://images.pexels.com/photos/417023/pexels-photo-417023.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1)`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '100%',
                    opacity: 0.8
                  }}></div>
                  
                  {/* Overlay with traffic indicators */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-600">67%</div>
                          <div className="text-xs text-secondary-600">Congestion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-warning-500">42</div>
                          <div className="text-xs text-secondary-600">Avg Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-accent-500">5</div>
                          <div className="text-xs text-secondary-600">Incidents</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-700">AI Prediction Accuracy</span>
                    <span className="font-semibold text-primary-600">95.2%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '95.2%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              Powerful Features for Smart Cities
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              Our comprehensive platform provides everything you need to optimize traffic flow 
              and improve urban mobility across Kenya.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-3">{feature.title}</h3>
                <p className="text-secondary-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-6">
                Measurable Impact on Urban Mobility
              </h2>
              <p className="text-xl text-secondary-600 mb-8">
                Join leading Kenyan cities that have transformed their traffic management 
                with MoveSmart KE's AI-powered solutions.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle size={20} className="text-primary-500 mr-3 flex-shrink-0" />
                    <span className="text-secondary-700">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">35%</div>
                  <div className="text-sm text-secondary-600">Less Congestion</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">20min</div>
                  <div className="text-sm text-secondary-600">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">95%</div>
                  <div className="text-sm text-secondary-600">Accuracy</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp size={20} className="text-primary-600 mr-3" />
                      <span className="font-medium text-secondary-900">Traffic Flow</span>
                    </div>
                    <span className="text-primary-600 font-bold">+35%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-success-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock size={20} className="text-success-600 mr-3" />
                      <span className="font-medium text-secondary-900">Response Time</span>
                    </div>
                    <span className="text-success-600 font-bold">-45%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-warning-50 rounded-lg">
                    <div className="flex items-center">
                      <Users size={20} className="text-warning-600 mr-3" />
                      <span className="font-medium text-secondary-900">User Satisfaction</span>
                    </div>
                    <span className="text-warning-600 font-bold">+60%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
              Trusted by Urban Planning Leaders
            </h2>
            <p className="text-xl text-secondary-600">
              See what traffic management professionals across Kenya are saying about MoveSmart KE.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-warning-500 fill-current" />
                  ))}
                </div>
                <p className="text-secondary-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-secondary-900">{testimonial.name}</div>
                    <div className="text-sm text-secondary-600">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your City's Traffic?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join the smart cities revolution. Start your free trial today and see the difference 
            AI-powered traffic optimization can make.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleGetStarted}
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
            >
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-600 transition-colors">
              Schedule Demo
            </button>
          </div>
          
          <p className="text-primary-200 text-sm mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-500 text-white mr-3">
                  <MapPin size={20} strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold">MoveSmart <span className="text-primary-500">KE</span></h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transforming urban mobility across Kenya with AI-powered traffic optimization solutions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 MoveSmart KE. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 