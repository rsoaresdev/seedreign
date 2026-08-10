import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 30% 20%, #1a2338 0%, #0a0e16 65%)",
      }}
    >
      <svg
        width="132"
        height="132"
        viewBox="0 0 32 32"
        role="img"
        aria-label="Seedreign"
      >
        {/* Sky and crown. */}
        <path
          d="M16 30.72C21.76 28.8 25.6 22.72 25.6 16.96C25.6 14.4 24.64 12.8 22.72 11.2L23.36 4.8 19.52 9.6 16 2.24 12.48 9.6 8.64 4.8 9.28 11.2C7.36 12.8 6.4 14.4 6.4 16.96C6.4 22.72 10.24 28.8 16 30.72Z"
          fill="#f6b73c"
        />
        {/* Land below the horizon. */}
        <path
          d="M25.6 17C25.6 22.72 21.76 28.8 16 30.72C10.24 28.8 6.4 22.72 6.4 17Z"
          fill="#16243d"
        />
        {/* The rising sun. */}
        <path
          d="M12.48 17C12.48 15.056 14.056 13.48 16 13.48C17.944 13.48 19.52 15.056 19.52 17Z"
          fill="#fff2d0"
        />
      </svg>
    </div>,
    size
  );
}
