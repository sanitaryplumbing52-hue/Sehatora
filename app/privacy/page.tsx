import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-serif text-3xl font-semibold">Privacy Policy</h1>
      <div className="prose mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-serif text-lg text-foreground">Your photos are private</h2>
          <p>
            Photos you upload are stored in encrypted, access-controlled storage. We never display your photos
            publicly. Every read of your photo goes through a short-lived, signed URL tied to your account —
            not a permanent public link.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-foreground">AI processing consent</h2>
          <p>
            We only analyze a photo after you explicitly consent at upload time. Analysis is used solely to
            generate your style profile and recommendations — body proportions, approximate body shape, skin
            tone/undertone, hair color, and dominant colors in your current outfit. We do not make inferences
            about sensitive or protected personal attributes.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-foreground">Your control</h2>
          <p>
            You can delete any photo at any time from your dashboard. Deletion removes the file from storage
            immediately. You may also request full account deletion, which removes your style profile, saved
            looks, and photos.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-lg text-foreground">Data we collect</h2>
          <p>
            Account details (name, email), uploaded photos (with consent), your style preferences, saved
            outfits, and minimal product-usage analytics events. We do not collect more personal data than is
            necessary to provide the service.
          </p>
        </section>
      </div>
    </div>
  );
}
