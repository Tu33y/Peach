'use client';

import React from 'react';
import Layout from '../../../components/Layout';


export default function PrivacyDocPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 prose prose-indigo">
        <h1 className="text-4xl font-black text-gray-900 mb-6">Politica sulla Privacy</h1>
        <p className="text-gray-600 leading-relaxed mb-4">
          La privacy dei nostri utenti è di fondamentale importanza. Raccogliamo esclusivamente i dati strettamente necessari all&apos;erogazione del servizio di marketplace.
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Minimizzazione dei Dati</h2>
        <p className="text-gray-600 mb-4">
          I dati relativi alla posizione generale vengono usati esclusivamente per calcolare le distanze e mostrare i servizi disponibili nelle vicinanze tramite OpenStreetMap.
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Diritto alla Cancellazione</h2>
        <p className="text-gray-600">
          Ogni utente può richiedere in qualsiasi momento la cancellazione permanente del proprio account e dei relativi dati personali non vincolati ad obblighi fiscali o di legge.
        </p>
      </div>
    </Layout>
  );
}
