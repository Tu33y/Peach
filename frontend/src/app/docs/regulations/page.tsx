'use client';

import React from 'react';
import Layout from '../../../components/Layout';


export default function RegulationsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 prose prose-indigo">
        <h1 className="text-4xl font-black text-gray-900 mb-6">Regolamento Utenti</h1>
        <p className="text-gray-600 leading-relaxed mb-4">
          La presente sezione definisce le regole d&apos;uso della piattaforma. Tutti gli utenti sono tenuti al rispetto delle condizioni di servizio per mantenere l&apos;affidabilità della community.
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-3">1. Comportamento Consenito</h2>
        <p className="text-gray-600 mb-4">
          Non è consentito lo scambio di contatti privati prima del pagamento dell&apos;ordine per garantire la sicurezza delle transazioni in Escrow.
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-3">2. Sanzioni</h2>
        <p className="text-gray-600">
          Gli amministratori possono bloccare gli account che violano ripetutamente i termini o ricevono molteplici segnalazioni verificate.
        </p>
      </div>
    </Layout>
  );
}
