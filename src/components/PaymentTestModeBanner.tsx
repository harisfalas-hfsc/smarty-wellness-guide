const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b-2 border-coral bg-card px-4 py-2 text-center text-sm">
        Membership payments are not live yet.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b-2 border-sun bg-card px-4 py-2 text-center text-sm">
        All payments made in the preview are in test mode.{" "}
        <a
          href="https://docs.lovable.dev/features/payments#test-and-live-environments"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          Read more
        </a>
      </div>
    );
  }
  return null;
}
