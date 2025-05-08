<template>
  <div class="legal-page-container">
    <div class="legal-content">
      <button @click="$router.go(-1)" class="back-button">&larr; Back</button>
      <h1>Privacy Policy</h1>
      <p><em>Last updated: {{ new Date().toLocaleDateString() }}</em></p>

      <section>
        <h2>1. Introduction</h2>
        <p>Your privacy is important to us. It is Rizzz's policy to respect your privacy regarding any information we may collect from you across our application, Music Notation Editor.</p>
        <p>This Privacy Policy applies to the Music Notation Editor application (hereinafter, "us", "we", or "Music Notation Editor").</p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p><strong>Locally Stored Data:</strong> The primary function of this application is to allow you to create and edit musical notations. All compositions, notes, settings, and related data you create are stored locally on your device using your browser's local storage capabilities or, if using features like "Export", directly to your filesystem. We do not transmit this personal musical data to our servers or any third-party servers unless you explicitly use a feature designed for sharing or cloud backup (which would be clearly indicated).</p>
        <p><strong>Usage Data (Optional/If Implemented):</strong> We may collect information that your browser sends whenever you visit our Service or when you access the Service by or through a mobile device ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data. (<em>Note: Specify if you actually collect this. If not, remove or state you don't.</em>)</p>
        <p><strong>Capacitor Filesystem:</strong> If you use features that interact with the device filesystem (e.g., import/export compositions via Capacitor's Filesystem API on native platforms), the application will request necessary permissions to read from or write to specific directories you choose. This data remains on your device unless you choose to move or share it.</p>
      </section>
      
      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect in various ways, including to:</p>
        <ul>
          <li>Provide, operate, and maintain our Application (primarily using locally stored data).</li>
          <li>Improve, personalize, and expand our Application.</li>
          <li>Understand and analyze how you use our Application (if usage data is collected).</li>
          <li>Develop new products, services, features, and functionality.</li>
          <li>Comply with legal obligations.</li>
        </ul>
        <p>Your musical compositions and related data stored locally are used solely for the functioning of the application on your device and are not accessed by us.</p>
      </section>

      <section>
        <h2>4. Data Storage and Security</h2>
        <p>Your musical compositions and application settings are stored locally on your device through browser local storage or the device filesystem. The security of this data depends on the security of your device and browser.</p>
        <p>We take reasonable measures to protect any information that might be transmitted if online features are used, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>
      </section>

      <section>
        <h2>5. Third-Party Services</h2>
        <p>This application does not integrate with third-party services that would collect your personal musical data by default. (<em>Note: If you use any third-party analytics, error reporting, etc., list them here and what data they collect.</em>)</p>
        <p>If using audio playback features (e.g., Tone.js with sample files), these audio files might be fetched from our servers or a CDN, but this does not involve collecting personal data from you beyond standard web server logs (like IP address for the request).</p>
      </section>
      
      <section>
        <h2>6. Children's Privacy</h2>
        <p>Our Service does not knowingly collect personally identifiable information from children under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers (if any such data was ever collected).</p>
      </section>

      <section>
        <h2>7. Changes to This Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
      </section>

      <section>
        <h2>8. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at joserizc@gmail.com.</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// No specific script needed for this static page
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
</style> 