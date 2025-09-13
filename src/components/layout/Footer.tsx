
import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-bank-blue text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-bank-gold bg-clip-text text-transparent">
                Suryaannarayan
              </span>
              <span className="ml-1 text-2xl font-bold text-white">Bank</span>
            </Link>
            <p className="mt-4 text-gray-300">
              Serving our customers with innovative banking solutions since 2024. Your trusted partner for financial growth.
            </p>
            <div className="flex mt-6 space-x-4">
              <a href="https://www.youtube.com/@Suryaannarayan" className="text-gray-300 hover:text-white transition duration-300" target="_blank" rel="noopener noreferrer">
                <Youtube size={20} />
              </a>
              <a href="https://x.com/suryaannarayan" className="text-gray-300 hover:text-white transition duration-300" target="_blank" rel="noopener noreferrer">
                <Twitter size={20} />
              </a>
              <a href="https://instagram.com/suryaannarayan/" className="text-gray-300 hover:text-white transition duration-300" target="_blank" rel="noopener noreferrer">
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white transition duration-300">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-300 hover:text-white transition duration-300">
                  Register
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition duration-300">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition duration-300">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Banking Services */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Banking Services</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition duration-300">
                  Savings Account
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition duration-300">
                  Fixed Deposits
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition duration-300">
                  Credit Cards
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin size={20} className="mr-2 mt-1 flex-shrink-0" />
                <span>Suryanarayan House, Dehradun, Uttarakhand, India 248140</span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-2 flex-shrink-0" />
                <span>+91 94XXX XXX80</span>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-2 flex-shrink-0" />
                <span>suryaannarayan@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-10 pt-6">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Suryaannarayan Bank. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
