import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins" });

export const metadata = {
  title: "Your Brand Cabs — Safe Journeys | Cab Booking",
  description: "Reliable cabs for outstation, airport and local transfers. Transparent pricing, verified drivers, 24/7.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} bg-white text-gray-900 antialiased`}>{children}</body>
    </html>
  );
}
