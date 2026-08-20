'use client';

import React, { useRef, useState } from 'react';
import { Pet } from '@/types';
import { Printer, Download, X, AlertTriangle, MapPin, Phone, Calendar, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MissingPosterModalProps {
  pet: Pet;
  qrDataUrl?: string;
  onClose: () => void;
}

export default function MissingPosterModal({ pet, qrDataUrl, onClose }: MissingPosterModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const fileName = `pawtro-poster-${(pet.petName || pet.species || 'pet').replace(/\s+/g, '-').toLowerCase()}`;

  const downloadPNG = async () => {
    if (!posterRef.current || downloadingPng) return;
    setDownloadingPng(true);
    try {
      // Ensure all images inside are loaded
      const images = posterRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve(true);
              else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
              }
            })
        )
      );

      const canvas = await html2canvas(posterRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export poster as PNG:', err);
      alert('ছবি ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে প্রিন্ট অপশনটি ব্যবহার করে PDF হিসেবে সংরক্ষণ করুন।');
    } finally {
      setDownloadingPng(false);
    }
  };

  const downloadPDF = async () => {
    if (!posterRef.current || downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const images = posterRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve(true);
              else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
              }
            })
        )
      );

      const canvas = await html2canvas(posterRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Center vertically if height is less than page
      const posY = imgHeight < pageHeight - 20 ? (pageHeight - imgHeight) / 2 : 10;

      pdf.addImage(imgData, 'JPEG', 10, posY, imgWidth, imgHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error('Failed to export poster as PDF:', err);
      alert('PDF ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে প্রিন্ট অপশনটি ব্যবহার করুন।');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isLost = pet.type === 'lost';
  const headerText = isLost ? 'হারিয়ে গেছে (LOST PET)' : pet.type === 'found' ? 'পাওয়া গেছে (FOUND PET)' : 'দত্তক দেওয়া হবে (FOR ADOPTION)';
  const headerBg = isLost ? 'bg-red-600 text-white' : pet.type === 'found' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white';

  const petPhoto = (typeof pet.images?.[0] === 'string'
    ? pet.images[0]
    : pet.images?.[0]?.url)
    || (pet.species === 'cat'
      ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-8">
        
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-black text-base sm:text-lg text-stone-900 leading-tight">প্রিন্টএবল পোস্টার</h3>
              <p className="text-[11px] text-stone-500">PDF, ছবি ডাউনলোড বা সরাসরি প্রিন্ট করুন</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            <button
              onClick={downloadPNG}
              disabled={downloadingPng || downloadingPdf}
              className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-xs"
              title="পোস্টার ছবি (PNG) হিসেবে ডাউনলোড করুন"
            >
              {downloadingPng ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-stone-600" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
              )}
              <span>ছবি (PNG)</span>
            </button>

            <button
              onClick={downloadPDF}
              disabled={downloadingPng || downloadingPdf}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
              title="A4 সাইজ PDF ডাউনলোড করুন"
            >
              {downloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>PDF ডাউনলোড</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={downloadingPng || downloadingPdf}
              className="inline-flex items-center gap-1.5 bg-stone-800 hover:bg-black text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
              title="প্রিন্টার বা ব্রাউজারের প্রিন্ট ডায়ালগ খুলুন"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl ml-1"
              aria-label="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Poster Area */}
        <div className="mt-4 print:m-0 print:p-0">
          <div
            ref={posterRef}
            id="printable-poster"
            className="border-4 border-black p-6 bg-white rounded-2xl print:border-4 print:p-8 print:rounded-none max-w-xl mx-auto text-center"
          >
            {/* Header Banner */}
            <div className={`py-3 px-4 rounded-xl font-black text-2xl sm:text-3xl tracking-tight uppercase ${headerBg}`}>
              {headerText}
            </div>

            {/* Subtitle / Urgency */}
            <div className="flex items-center justify-center gap-2 mt-3 text-red-600 font-bold text-sm sm:text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>সন্ধান পেলে অনুগ্রহ করে দ্রুত যোগাযোগ করুন</span>
            </div>

            {/* Pet Image */}
            <div className="my-4 border-2 border-black rounded-xl overflow-hidden aspect-4/3 max-h-[320px] bg-stone-100">
              <img
                src={petPhoto}
                crossOrigin="anonymous"
                alt={pet.petName || 'Pet'}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Pet Name & Breed */}
            <div className="border-b-2 border-stone-200 pb-3">
              <h1 className="text-3xl font-black text-black">
                {pet.petName || (pet.species === 'cat' ? 'বিড়াল' : 'কুকুর')}
              </h1>
              <p className="text-stone-700 font-bold text-base mt-0.5">
                জাত: {pet.breed || 'দেশি'} | লিঙ্গ: {pet.sex === 'male' ? 'পুরুষ' : 'স্ত্রী'} | বয়স: {pet.age || 'অজানা'}
              </p>
            </div>

            {/* Key Information */}
            <div className="py-3 text-left space-y-2 text-sm text-stone-800">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span><b>স্থান:</b> {pet.area}, {pet.division}</span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                <span><b>তারিখ:</b> {formatDate(pet.eventDate || pet.createdAt)}</span>
              </div>
              {pet.marks && (
                <div className="p-2 bg-stone-100 rounded-lg text-xs font-semibold text-stone-900 border border-stone-300">
                  ⚠️ <b>শনাক্তকারী চিহ্ন:</b> {pet.marks}
                </div>
              )}
              {pet.rewardAmount && (
                <div className="p-2 bg-amber-100 rounded-lg text-sm font-black text-amber-900 border border-amber-300 text-center">
                  🎁 পুরস্কার: {pet.rewardAmount}
                </div>
              )}
            </div>

            {/* Contact & QR Code Section */}
            <div className="mt-4 pt-4 border-t-2 border-black flex items-center justify-between gap-4 bg-stone-50 p-4 rounded-xl">
              <div className="text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">যোগাযোগ করুন</span>
                <div className="text-xl sm:text-2xl font-black text-black flex items-center gap-2 mt-1">
                  <Phone className="w-6 h-6 text-emerald-600" />
                  <span>{pet.contactPhone || 'ইনবক্সে মেসেজ দিন'}</span>
                </div>
                <p className="text-[11px] text-stone-500 mt-1">Pawtro - হারানো ও পাওয়া পোষ্য প্ল্যাটফর্ম</p>
              </div>

              {qrDataUrl && (
                <div className="shrink-0 text-center">
                  <img src={qrDataUrl} crossOrigin="anonymous" alt="QR Code" className="w-20 h-20 border border-black rounded-lg bg-white p-1" />
                  <span className="text-[10px] font-bold text-stone-600 block mt-1">স্ক্যান করে বিস্তারিত দেখুন</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400 print:hidden px-1">
          <span>প্রিন্ট অপশনে গিয়ে A4 সাইজ সিলেক্ট করুন এবং Portrait মোডে প্রিন্ট করুন।</span>
          <span className="text-stone-500 font-medium">অথবা সরাসরি PDF/ছবি ডাউনলোড করুন</span>
        </div>
      </div>
    </div>
  );
}
