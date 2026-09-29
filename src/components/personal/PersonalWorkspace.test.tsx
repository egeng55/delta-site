import { fireEvent, render, screen } from '@testing-library/react';
import PersonalWorkspace from './PersonalWorkspace';
it('keeps technical navigation and runtime requests out of the personal experience', () => {
 const prior = global.fetch; global.fetch = jest.fn();
 try {
 render(<PersonalWorkspace />);
 expect(screen.queryByText('Engineering')).not.toBeInTheDocument(); expect(screen.queryByText('Analytics')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Your request'), { target: { value: 'Plan my day' } });
 fireEvent.click(screen.getByRole('link', { name: 'Results' }));
 expect(screen.getByText(/Your completed work/)).toBeInTheDocument();
 fireEvent.click(screen.getByRole('link', { name: 'Ask Delta' }));
 expect(screen.getByLabelText('Your request')).toHaveValue('Plan my day'); expect(fetch).not.toHaveBeenCalled();
 } finally { global.fetch = prior; }
});
