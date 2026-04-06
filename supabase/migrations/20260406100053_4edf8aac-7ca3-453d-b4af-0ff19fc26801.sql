
DROP POLICY "System can insert payments" ON public.payments;
CREATE POLICY "Authenticated users can insert payments" ON public.payments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND tenant_id = auth.uid())
  );
