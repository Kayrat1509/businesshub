import React from 'react';
import { MessageCircle, Mail } from 'lucide-react';

const ContactPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Mail className="w-16 h-16 text-primary-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">Связаться с нами</h1>
          </div>

          <div className="card p-8 text-center">
            <div className="space-y-6">
              <div className="w-24 h-24 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-12 h-12 text-primary-400" />
              </div>

              <div>

                <div className="bg-dark-700 p-6 rounded-lg">
                  <h3 className="text-white font-medium mb-3">Нужна помощь прямо сейчас?</h3>
                  <p className="text-dark-300 mb-4">Свяжитесь с нами через WhatsApp</p>
                  <a
                    href="https://wa.me/77776323616"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp: +7 777 632 36 16
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;