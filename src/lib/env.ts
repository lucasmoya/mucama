// Environment variables for Supabase
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "https://qqznwcqkpgrpnlozzkmq.supabase.co",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxem53Y3FrcGdycG5sb3p6a21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNDM3NzYsImV4cCI6MjA2NjcxOTc3Nn0.l8MzCXEVcAub683UtCeINQLwLr1VEmrNtl6Yt_NwKJk",
} as const; 