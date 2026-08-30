import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | SmartyWellness" },
      {
        name: "description",
        content:
          "Terms and conditions for using SmartyWellness — a daily wellness guidance app for check-ins, missions and balanced living, part of the Smarty family.",
      },
      { property: "og:title", content: "Terms & Conditions — SmartyWellness" },
      {
        property: "og:description",
        content: "Legal terms for using the SmartyWellness daily wellness guidance app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalLayout title="Terms & Conditions" icon={<FileText className="h-5 w-5" />} lastUpdated="August 2026">
      <p>
        Welcome to <strong>Smarty Wellness</strong> (smartywellness.com). By accessing or using our
        wellness guidance service, you agree to comply with and be bound by the following Terms
        &amp; Conditions. Please read them carefully before using Smarty Wellness.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Smarty Wellness, you confirm that you have read, understood, and
        agree to these Terms &amp; Conditions. If you do not agree, please do not use our website
        or app.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use Smarty Wellness. Users between 13 and 18 may only
        use Smarty Wellness with the supervision and explicit consent of a parent or legal
        guardian.
      </p>

      <h2>3. What Smarty Wellness Is</h2>
      <p>
        Smarty Wellness is a web app that helps you reflect on how you feel and take one clear
        action each day. Specifically, Smarty Wellness provides:
      </p>
      <ul>
        <li>A daily wellness check-in covering energy, mood, sleep, stress and focus.</li>
        <li>Personalized daily missions and optional wellness challenges.</li>
        <li>A guidance coach that suggests small, practical next steps.</li>
        <li>A bucket list, journey history and periodic reviews of your progress.</li>
        <li>Links to the wider Smarty ecosystem (Smarty Workout, Smarty Diet, Smarty Move).</li>
      </ul>
      <p>
        Smarty Wellness is intended for <strong>personal educational and lifestyle purposes only</strong>{" "}
        and is <strong>not a substitute for medical, psychological, or other professional advice</strong>,
        diagnosis, or treatment. Smarty Wellness does not diagnose or treat any physical or mental
        health condition.
      </p>

      <h2>4. Account Registration</h2>
      <ul>
        <li>You must provide accurate, complete, and up-to-date information when creating your account.</li>
        <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
        <li>You agree not to share your account with others.</li>
        <li>You are responsible for all activity that occurs under your account.</li>
      </ul>

      <h2>5. Membership &amp; Pricing</h2>
      <ul>
        <li>
          Where a paid membership is offered, the applicable price, billing period and included
          features are shown clearly before you confirm your purchase.
        </li>
        <li>
          Any membership renews automatically for the stated period until you cancel. You can
          cancel at any time from your account settings; access continues until the end of the
          current billing period.
        </li>
        <li>Prices may change with prior notice. Continued use after a price change constitutes acceptance of the new price.</li>
        <li>
          Under EU consumer law you have a 14-day right of withdrawal for digital services, unless
          you expressly request immediate access and acknowledge losing that right once the service
          is fully performed.
        </li>
      </ul>

      <h2>6. Availability</h2>
      <ul>
        <li>
          The service is provided &quot;as is&quot; and we may change, improve, or discontinue
          individual features at any time, provided this does not materially reduce the value of
          your paid membership without notice.
        </li>
        <li>Your statutory consumer rights under EU and national law remain unaffected.</li>
      </ul>

      <h2>7. Health &amp; Wellbeing Requirements</h2>
      <ul>
        <li>
          <strong>Truthful disclosure:</strong> You must provide accurate answers in your check-ins
          and profile. Inaccurate answers may lead to unsuitable guidance.
        </li>
        <li>
          <strong>Professional consultation:</strong> Always consult a qualified doctor, therapist
          or other professional before making significant changes to your lifestyle, sleep,
          activity or stress management — especially if you have a pre-existing physical or mental
          health condition, are pregnant, or are taking medication.
        </li>
        <li>
          <strong>Seek help:</strong> If you experience distress, worsening mood, or any concerning
          symptoms, stop using the app for guidance and contact a qualified professional or your
          local emergency services.
        </li>
        <li>
          Check-ins, missions and reviews are general wellbeing prompts and are not a medical or
          psychological assessment, diagnosis, therapy or treatment.
        </li>
        <li>
          <strong>Assumption of risk:</strong> Acting on any suggestion is entirely at your own
          risk. See our Disclaimer page for the complete release of liability.
        </li>
      </ul>

      <h2>8. AI-Assisted Content</h2>
      <ul>
        <li>
          Missions, coach messages and recommendations may be generated with the assistance of AI
          models based on your profile, check-ins and preferences.
        </li>
        <li>
          AI output may contain errors, omissions, or unsuitable suggestions. You are responsible
          for reviewing every suggestion before acting on it and for skipping anything that does
          not feel safe or appropriate for you.
        </li>
        <li>
          Scores, streaks and wellbeing indicators shown in the app are approximations for
          self-reflection only, not clinical measurements.
        </li>
      </ul>

      <h2>9. Third-Party Services</h2>
      <ul>
        <li><strong>Hosting &amp; infrastructure providers:</strong> Host the database, authentication, and payment processing.</li>
        <li><strong>AI provider(s):</strong> Used to generate your personalized wellness guidance.</li>
        <li><strong>Payment processor:</strong> Used to securely process any membership payment.</li>
      </ul>

      <h2>10. Acceptable Use</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Reverse engineer, decompile, or attempt to extract the source code of Smarty Wellness.</li>
        <li>Use Smarty Wellness for any unlawful, harmful, or fraudulent purpose.</li>
        <li>Upload malicious content or attempt to interfere with the service.</li>
        <li>Resell, sublicense, or share access to your account or generated guidance.</li>
        <li>Use Smarty Wellness to provide medical, psychological or therapeutic advice to other people.</li>
      </ul>

      <h2>11. Intellectual Property</h2>
      <p>
        All content, branding, methodology, source code, and copy in Smarty Wellness are the
        intellectual property of <strong>Smarty Wellness</strong> and are protected by copyright,
        trademark, and other intellectual property laws. You receive a limited, personal,
        non-transferable, non-exclusive license to use Smarty Wellness for personal,
        non-commercial purposes only.
      </p>

      <h2>12. Account Deletion &amp; Cancellation</h2>
      <ul>
        <li>You can cancel any membership and delete your account at any time from your settings.</li>
        <li>Before deletion, you can download a copy of your account data.</li>
        <li>
          Account deletion permanently removes your profile, preferences, check-ins, missions and
          journey history, except where short operational backup windows or legal obligations apply.
        </li>
        <li>Some records (e.g. transaction history) may be retained where required by tax or legal obligations.</li>
      </ul>

      <h2>13. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Smarty Wellness shall not be liable for any
        indirect, incidental, consequential, special, punitive, or exemplary damages arising from
        your use of Smarty Wellness, including but not limited to physical or emotional harm, loss
        of data, lost profits, or business interruption. Nothing in these Terms excludes liability
        that cannot be excluded under applicable consumer protection law.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify users of material changes via
        the app or email. Continued use of Smarty Wellness after changes take effect constitutes
        acceptance of the updated Terms.
      </p>

      <h2>15. Governing Law &amp; Jurisdiction</h2>
      <p>
        These Terms are governed by applicable law and EU regulations. Any disputes shall be
        subject to the jurisdiction of the competent courts, while preserving any mandatory
        consumer protection rights you have in your country of residence.
      </p>

      <h2>16. Contact</h2>
      <p>
        For questions about these Terms, contact <strong>Smarty Wellness</strong> at{" "}
        <a href="mailto:smartywellness@outlook.com">smartywellness@outlook.com</a>.
      </p>
    </LegalLayout>
  );
}
