<template>
  <div class="legal-page-container">
    <div class="legal-content">
      <button @click="$router.go(-1)" class="back-button">&larr; Back</button>
      <h1>Terms and Conditions</h1>
      <p><em>Last updated: {{ new Date().toLocaleDateString() }}</em></p>

      <section>
        <h2>1. Introduction</h2>
        <p>Welcome to St Cecilia's Songbook! These terms and conditions outline the rules and regulations for the use of Our Application.</p>
        <p>By accessing this application we assume you accept these terms and conditions. Do not continue to use St Cecilia's Songbook if you do not agree to take all of the terms and conditions stated on this page.</p>
      </section>

      <section>
        <h2>2. Intellectual Property Rights</h2>
        <p>Other than the content you own, under these Terms, Rizzz and/or its licensors own all the intellectual property rights and materials contained in this Application. You are granted limited license only for purposes of viewing the material contained on this Application.</p>
        <p>Specifically, compositions you create and save locally are your property. We do not claim ownership of user-generated musical content.</p>
      </section>

      <section>
        <h2>3. Restrictions</h2>
        <p>You are specifically restricted from all of the following:</p>
        <ul>
          <li>Publishing any Application material in any other media without consent.</li>
          <li>Selling, sublicensing and/or otherwise commercializing any Application material.</li>
          <li>Publicly performing and/or showing any Application material without consent, unless it is your own original work created with the Application.</li>
          <li>Using this Application in any way that is or may be damaging to this Application.</li>
          <li>Using this Application in any way that impacts user access to this Application.</li>
          <li>Using this Application contrary to applicable laws and regulations, or in any way may cause harm to the Application, or to any person or business entity.</li>
          <li>Engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Application.</li>
        </ul>
      </section>

      <section>
        <h2>4. Your Content</h2>
        <p>In these Application Standard Terms and Conditions, "Your Content" shall mean any audio, video text, images or other material you choose to create or display on this Application (e.g., musical compositions, lyrics). By creating Your Content, you grant Rizzz a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media *only if features for sharing or cloud storage provided by us are used by you*. For content stored locally on your device, we claim no rights.</p>
        <p>Your Content must be your own and must not be invading any third-party's rights. Rizzz reserves the right to remove any of Your Content from this Application at any time without notice if it violates these terms or any applicable laws (e.g., copyright infringement).</p>
      </section>

      <section>
        <h2>5. No warranties</h2>
        <p>This Application is provided "as is," with all faults, and Rizzz express no representations or warranties, of any kind related to this Application or the materials contained on this Application. Also, nothing contained on this Application shall be interpreted as advising you.</p>
      </section>

      <section>
        <h2>6. Limitation of liability</h2>
        <p>In no event shall Rizzz, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Application whether such liability is under contract. Rizzz, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Application.</p>
      </section>

      <section>
        <h2>7. Indemnification</h2>
        <p>You hereby indemnify to the fullest extent Rizzz from and against any and/or all liabilities, costs, demands, causes of action, damages and expenses arising in any way related to your breach of any of the provisions of these Terms.</p>
      </section>

      <section>
        <h2>8. Severability</h2>
        <p>If any provision of these Terms is found to be invalid under any applicable law, such provisions shall be deleted without affecting the remaining provisions herein.</p>
      </section>

      <section>
        <h2>9. Variation of Terms</h2>
        <p>Rizzz is permitted to revise these Terms at any time as it sees fit, and by using this Application you are expected to review these Terms on a regular basis.</p>
      </section>

      <section>
        <h2>10. Governing Law & Jurisdiction</h2>
        <p>These Terms will be governed by and interpreted in accordance with the laws of Philippines, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Philippines for the resolution of any disputes.</p>
      </section>

      <p class="contact-info">If you have any questions about these Terms, please contact us at joserizc@gmail.com.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for this static page, but setup is here if you add interactivity later.
</script>

<style scoped>
.legal-page-container {
  padding: 20px;
  font-family: Arial, sans-serif;
  line-height: 1.6;
  background-color: #f9f9f9;
  min-height: 100vh;
  display: flex;
  justify-content: center;
}

.legal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  max-width: 800px;
  width: 100%;
}

.legal-content h1 {
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-top: 0;
}

.legal-content h2 {
  color: #555;
  margin-top: 30px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.legal-content p, .legal-content li {
  color: #444;
  margin-bottom: 10px;
}

.legal-content ul {
  padding-left: 20px;
}

.legal-content em {
  color: #777;
  font-size: 0.9em;
}

.back-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #0056b3;
}

.contact-info {
  margin-top: 30px;
  font-style: italic;
  color: #666;
}
</style> 