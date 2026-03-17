"use client";

import { useState } from "react";
import { Metadata } from "next";
import { Shield, User, Mail, Phone, FileText, Send, CheckCircle } from "lucide-react";

export default function KVKKBasvuruPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    requestType: "access", // access, correction, deletion, objection
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Takip numarası oluştur
    const tracking = `KVKK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    setTrackingNumber(tracking);

    // TODO: API'ye gönder
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Başvurunuz Alındı
            </h1>

            <p className="text-gray-600 mb-6">
              KVKK başvurunuz başarıyla kaydedildi. Başvurunuz en kısa sürede
              değerlendirilecektir.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-blue-600 mb-2">Başvuru Takip Numaranız</p>
              <p className="text-2xl font-mono font-bold text-blue-900">{trackingNumber}</p>
              <p className="text-sm text-blue-600 mt-2">
                Bu numarayı başvurunuzun durumunu sorgulamak için kullanabilirsiniz.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Başvurunuzun sonucu e-posta adresinize gönderilecektir.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Yeni Başvuru Oluştur
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                KVKK Başvuru Formu
              </h1>
              <p className="text-gray-500">
                Kişisel veri haklarınızı kullanmak için formu doldurun
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ad Soyad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Ad Soyad
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Adınız ve soyadınız"
              />
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                E-posta Adresi
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefon Numarası
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5XX XXX XXXX"
              />
            </div>

            {/* Talep Türü */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Talep Türü
              </label>
              <select
                value={formData.requestType}
                onChange={(e) =>
                  setFormData({ ...formData, requestType: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="access">Veri Erişim Talebi (Hangi verilerim var?)</option>
                <option value="correction">Düzeltme Talebi (Verilerim yanlış)</option>
                <option value="deletion">Silme Talebi (Verilerimi silin)</option>
                <option value="objection">İtiraz (İşlemeye karşıyım)</option>
                <option value="portability">Taşınabilirlik (Verilerimi alayım)</option>
              </select>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Talebinizle ilgili detaylı bilgi verin..."
              />
            </div>

            {/* Bilgilendirme */}
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
              <p>
                Başvurunuz 6698 sayılı KVKK kapsamında değerlendirilecektir.
                Yanıt süresi en fazla 30 gündür. Başvurunuzun sonucu e-posta
                adresinize gönderilecektir.
              </p>
            </div>

            {/* Gönder Butonu */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Başvuruyu Gönder
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
