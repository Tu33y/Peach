'use client';

import React from 'react';
import Layout from '../../../components/Layout';


export default function EscrowDocPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 prose prose-indigo">
        <h1 className="text-4xl font-black text-gray-900 mb-6">Sistema di Commissioni &amp; Escrow</h1>
        <p className="text-gray-600 leading-relaxed mb-4">
          LavoroHub utilizza un sistema di protezione dei fondi denominato Escrow per garantire la sicurezza di venditori e acquirenti.
        </p>
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-3">Come Funziona</h2>
        <ul className="list-disc pl-5 text-gray-600 space-y-2">
          <li><strong>Blocco Fondi:</strong> All&apos;accettazione dell&apos;ordine, i fondi dell&apos;acquirente vengono trasferiti in un wallet protetto temporaneo.</li>
          <li><strong>Completamento:</strong> Al termine del servizio, la piattaforma applica una commissione standard del 10% e sblocca il restante 90% a favore del fornitore.</li>
          <li><strong>Rimborso:</strong> In caso di cancellazione condivisa, i fondi bloccati ritornano interamente all&apos;acquirente senza penali.</li>
        </ul>
      </div>
    </Layout>
  );
}
