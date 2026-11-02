import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";
import { CONTACT_URL, OPERATOR } from "@/lib/legal";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Privacy Policy",
  description:
    "How Imaginry handles your data: designs render on your device, photos never leave it, optional Google sign-in, no ad cookies, and only anonymous usage stats.",
  path: "/privacy",
  image: "/og/home.png",
  imageAlt: "Imaginry — backgrounds that move",
});

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        Imaginry (imaginry.tech) is a free browser studio for abstract backgrounds made with shader effects (no AI), run by {OPERATOR}. In this policy
        &ldquo;we&rdquo; means {OPERATOR} and &ldquo;you&rdquo; means anyone using the site. We are the controller of the
        small amount of data described below.
      </p>
    ),
  },
  {
    id: "on-device",
    title: "What stays on your device",
    body: (
      <>
        <p>Most of Imaginry never touches our servers:</p>
        <ul>
          <li>
            <strong>Rendering and exports.</strong> Every effect runs on your GPU in the browser. PNGs, videos and embed
            code are generated locally and downloaded straight from your browser.
          </li>
          <li>
            <strong>Photos you add.</strong> An image you drop into the studio is opened locally and is never uploaded.
            It is also left out of share links, saved designs and embed code.
          </li>
          <li>
            <strong>Saved designs.</strong> Designs you save are kept in your browser&rsquo;s local storage. Clearing
            your site data deletes them, and we can&rsquo;t see or recover them.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "google",
    title: "Signing in with Google",
    body: (
      <>
        <p>
          Signing in is optional. The studio works fully without an account. If you choose &ldquo;Continue with
          Google&rdquo;, Google asks your permission to share basic profile information with Imaginry. We request only
          the standard <code>openid</code>, <code>email</code> and <code>profile</code> scopes, which give us:
        </p>
        <ul>
          <li>your Google account ID, so we can recognise you when you sign in again;</li>
          <li>your name and profile picture, shown in the studio&rsquo;s account panel;</li>
          <li>your email address, to identify your account and contact you about it if needed.</li>
        </ul>
        <p>
          We don&rsquo;t get your Google password, and we don&rsquo;t access your Gmail, Drive, contacts, calendar or any
          other Google data.
        </p>
        <p>
          <strong>How we use it.</strong> Only to sign you in, keep you signed in, and show who is signed in. We
          don&rsquo;t use Google user data for advertising, don&rsquo;t sell it, don&rsquo;t transfer it to third parties
          (other than the hosting providers that store it for us), and don&rsquo;t use it to train AI or machine
          learning models.
        </p>
        <p>
          <strong>Storage.</strong> This profile, plus the sign-in tokens Google issues and a record of your sessions
          (including IP address and browser user agent), is stored in our database. Sessions expire after 7 days of
          inactivity.
        </p>
        <p>
          <strong>Deletion.</strong> You can sign out at any time. To delete your account, open the account panel at the
          bottom left of the studio and choose <em>Delete account</em>: your profile, sign-in tokens and sessions are
          removed from our database straight away. If you can&rsquo;t sign in,{" "}
          <a href={CONTACT_URL} target="_blank" rel="noopener">
            message us
          </a>{" "}
          and we&rsquo;ll remove it within 30 days. You can also revoke Imaginry&rsquo;s access at any time from your{" "}
          <a href="https://myaccount.google.com/connections" target="_blank" rel="noopener">
            Google account settings
          </a>
          .
        </p>
        <p>
          Imaginry&rsquo;s use and transfer of information received from Google APIs adheres to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <ul>
          <li>
            <strong>Short links.</strong> When you create a short share link, we store the design&rsquo;s settings
            (colors, effects, values) under a code derived from those settings. It contains no personal information and
            isn&rsquo;t tied to you. Links are kept so they keep working. Plain share links that carry the design in the
            URL after the <code>#</code> are never sent to us at all.
          </li>
          <li>
            <strong>Abuse protection.</strong> To stop the link service being flooded, we count requests per IP address.
            That counter expires after 60 seconds.
          </li>
          <li>
            <strong>Usage statistics.</strong> We use Umami, a privacy-focused analytics tool, to see
            which pages are visited. It records page views, referrer, browser, device type and approximate country. It
            does not use cookies, does not build a profile of you and isn&rsquo;t shared with ad networks.
          </li>
          <li>
            <strong>Server logs.</strong> Like any website, our hosting provider may briefly log technical request data
            such as IP address, user agent and time, for security and to keep the site running.
          </li>
          <li>
            <strong>Sponsors.</strong> If you book a sponsorship, we keep what you send us to run it: your brand name,
            logo, link and the conversation we had. See the <Link href="/sponsor/terms">sponsor terms</Link>.
          </li>
        </ul>
        <p>
          You never need an account to use the studio. We only receive your name and email if you choose to sign in
          with Google (see above), and we never ask for a password.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>
          Imaginry sets no advertising or tracking cookies, which is why you won&rsquo;t see a cookie banner. If you
          sign in, we set strictly necessary cookies that keep you signed in; they are removed when you sign out. The
          studio uses your browser&rsquo;s local storage only to remember your saved designs, and that data stays on
          your device.
        </p>
        <p>Fonts are served from our own domain, so loading a page doesn&rsquo;t send requests to Google.</p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <>
        <p>We use the data above only to:</p>
        <ul>
          <li>sign you in and keep you signed in, if you choose to use Google sign-in;</li>
          <li>make short links resolve to the right design;</li>
          <li>keep the service secure and protect it from abuse;</li>
          <li>understand which features and pages are useful, in aggregate;</li>
          <li>deliver sponsorships we&rsquo;ve agreed with you.</li>
        </ul>
        <p>
          Our legal bases are our legitimate interest in running a secure, useful site, your consent when you choose to
          sign in with Google, and, for sponsors, performing our agreement with you. We don&rsquo;t sell or rent data, and we don&rsquo;t use it for advertising profiles.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <p>
        Only the service providers that host the site and its database, acting on our behalf. Sponsors receive nothing
        from us: clicks on a sponsor go straight to their site, marked as sponsored, and from there their own privacy
        policy applies. We will disclose data if the law requires it.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "Where data is stored",
    body: (
      <>
        <p>
          Account data and short links are stored on servers we operate or rent from hosting providers, which may be in
          a different country from yours. Google processes sign-in data under its own privacy policy and may also
          transfer it internationally.
        </p>
        <p>
          When personal data from the EU, UK or Switzerland is transferred to a country without an adequacy decision, we
          rely on appropriate safeguards such as the European Commission&rsquo;s Standard Contractual Clauses. Data is
          sent over encrypted connections, access is limited to {OPERATOR}, and we keep it only as long as described in
          this policy: account data until you delete your account, sessions until they expire.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live (for example under the GDPR or CCPA), you can ask to access, correct or delete
          personal data we hold about you, or object to how we use it. If you never signed in, we usually hold nothing we
          can link back to you, but we&rsquo;ll always look. If you did, we can export or delete your account data.
        </p>
        <p>
          To make a request, <a href={CONTACT_URL} target="_blank" rel="noopener">message us on X</a>. You can also
          complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Imaginry isn&rsquo;t directed at children under 13 and we don&rsquo;t knowingly collect data from them.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        If we change how we handle data, we&rsquo;ll update this page and the date at the top. Significant changes will
        be noted on the site.
      </p>
    ),
  },
];

export default function Page() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={
        <p>
          The short version: your designs render on your device, your photos never leave it, signing in is optional and there
          are no tracking cookies. If you sign in with Google we keep only your name, email and profile picture to run
          your account. Otherwise we only see anonymous page stats and the settings of designs you choose to share.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
