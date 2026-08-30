import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer & Release of Liability | SmartyWellness" },
      {
        name: "description",
        content:
          "SmartyWellness disclaimer and release of liability — wellness guidance only, not medical or psychological advice.",
      },
      { property: "og:title", content: "Disclaimer — SmartyWellness" },
      {
        property: "og:description",
        content: "Important safety, health, and liability information for SmartyWellness users.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <LegalLayout
      title="Disclaimer & Release of Liability"
      icon={<AlertTriangle className="h-5 w-5" />}
      lastUpdated="August 2026"
    >
      <div className="callout">
        <strong>⚠️ Not medical or psychological advice.</strong> Smarty Wellness offers general
        wellbeing guidance based on the information you provide. It is not a doctor, therapist,
        psychologist, dietitian or personal trainer. Before making changes to your lifestyle, and
        especially if you have any medical or mental health condition, are pregnant, or take
        medication, consult a qualified professional.
      </div>

      <p>
        The information provided by <strong>Smarty Wellness</strong> (smartywellness.com) is
        intended solely for <strong>general educational and lifestyle purposes</strong>. Smarty
        Wellness does not provide medical, psychological, therapeutic, nutritional or training
        advice, diagnosis, or treatment.
      </p>

      <h2>1. Not Medical or Psychological Advice</h2>
      <ul>
        <li>Check-ins, missions, challenges, coach messages and educational content are <strong>for general wellbeing purposes only</strong>.</li>
        <li>Always <strong>consult a qualified professional</strong> before making significant changes to your sleep, activity, nutrition, stress management or medication.</li>
        <li>Do not disregard or delay professional advice because of information provided by Smarty Wellness.</li>
        <li>If you experience distress, worsening mood, pain, or any adverse reaction, <strong>stop and seek professional help immediately</strong>.</li>
      </ul>

      <div className="callout">
        <strong>In a crisis.</strong> Smarty Wellness is not an emergency service and does not
        monitor your entries in real time. If you are in danger or thinking about harming yourself,
        contact your local emergency number or the EU-wide emergency line <strong>112</strong>
        right away.
      </div>

      <h2>2. Self-Reporting &amp; Truthful Disclosure</h2>
      <p>
        Your guidance is built from what you report in your check-ins and profile. These prompts
        are simple self-reflection questions, not a clinical screening, assessment or diagnostic
        instrument. If you are unsure about your ability to follow any suggestion safely, consult
        a doctor first.
      </p>
      <ul>
        <li>You are responsible for providing accurate and complete information about how you feel and any health conditions.</li>
        <li>Inaccurate answers may result in guidance that is unsuitable for you.</li>
        <li>You must update your profile whenever your health status changes.</li>
      </ul>

      <h2>3. AI-Assisted Content</h2>
      <ul>
        <li>Guidance may be generated with the assistance of AI and may contain errors, omissions, or unsuitable suggestions.</li>
        <li>You are responsible for reviewing every suggestion before acting on it, and for adjusting or skipping anything that does not feel safe for you.</li>
        <li>Scores, streaks and indicators are approximations for reflection only, never clinical measurements.</li>
      </ul>

      <h2>4. Connected Smarty Products</h2>
      <p>
        Smarty Wellness may link to other Smarty products (Smarty Workout, Smarty Diet, Smarty
        Move). Each product has its own terms and disclaimers, and Smarty Wellness is not
        responsible for the content or outcomes of those separate services.
      </p>

      <h2>5. Personal Responsibility</h2>
      <ul>
        <li>You are responsible for acting within your <strong>personal limits and abilities</strong> and for skipping anything that does not feel safe for you.</li>
        <li>Minors (under 18) must use Smarty Wellness only with supervision and, where relevant, prior clearance from a qualified healthcare professional.</li>
      </ul>

      <h2>6. No Guarantee of Results</h2>
      <ul>
        <li>Results vary by individual based on age, health status, circumstances, lifestyle, consistency, and follow-through.</li>
        <li>Smarty Wellness <strong>does not guarantee</strong> any specific improvement in mood, energy, sleep, stress, habits or health outcomes.</li>
      </ul>

      <h2>7. Release of Liability &amp; Waiver of Claims</h2>
      <p>To the fullest extent permitted by law in the European Union and internationally:</p>
      <ul>
        <li>
          <strong>Complete release:</strong> By using Smarty Wellness, you voluntarily and
          knowingly assume all risks associated with acting on general wellbeing guidance and
          hereby <strong>RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE</strong> Smarty
          Wellness and its respective operators, owners, contributors, employees, contractors,
          affiliates, and agents from any and all liability arising from your use of Smarty
          Wellness.
        </li>
        <li>
          <strong>No liability:</strong> Smarty Wellness and its representatives <strong>shall not
          be held liable</strong> for any direct, indirect, incidental, consequential, special,
          punitive, or exemplary damages arising from following any guidance provided by Smarty
          Wellness, including but not limited to:
          <ul>
            <li>Personal illness, injury, or disability</li>
            <li>Aggravation of pre-existing physical or mental health conditions</li>
            <li>Medical or therapy expenses or costs</li>
            <li>Lost wages or income</li>
            <li>Pain and suffering</li>
            <li>Emotional distress</li>
          </ul>
        </li>
        <li>
          <strong>Waiver of right to sue:</strong> You expressly waive any right to bring legal
          action against Smarty Wellness for illnesses, injuries, or damages sustained during or
          after use of the app.
        </li>
        <li>
          <strong>Indemnification:</strong> You agree to indemnify and hold harmless Smarty
          Wellness from any claims, damages, or expenses (including legal fees) arising from your
          use of Smarty Wellness or breach of this Disclaimer.
        </li>
      </ul>
      <p>
        Nothing in this Disclaimer excludes or limits liability that cannot be excluded or limited
        under applicable law, including your statutory rights as a consumer under EU
        consumer-protection directives.
      </p>

      <h2>8. Jurisdiction &amp; Governing Law</h2>
      <p>
        This Disclaimer is governed by applicable law and EU regulations. Any disputes shall be
        subject to the jurisdiction of the competent courts, while preserving any mandatory
        consumer protection rights you have in your country of residence.
      </p>

      <div className="callout">
        <strong>⚠️ Acceptance and acknowledgment.</strong> By accessing and using Smarty Wellness,
        you acknowledge and confirm that you have:
        <ul>
          <li><strong>Read and understood</strong> this entire Disclaimer and Release of Liability.</li>
          <li><strong>Provided truthful answers</strong> about how you feel and your health conditions.</li>
          <li><strong>Obtained professional clearance</strong> if your health status requires it.</li>
          <li><strong>Voluntarily assumed all risks</strong> associated with acting on general wellbeing guidance.</li>
          <li><strong>Released Smarty Wellness from all liability</strong> for any illness, injury, or damages arising from your use of the app.</li>
          <li><strong>Agreed to use Smarty Wellness at your own risk.</strong></li>
        </ul>
        <p style={{ marginTop: 8, fontWeight: 700 }}>
          If you do not agree with any part of this Disclaimer, do not use Smarty Wellness.
        </p>
      </div>
    </LegalLayout>
  );
}
