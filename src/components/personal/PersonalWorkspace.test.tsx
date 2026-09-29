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
it('lets a request starter populate an editable draft without executing it',()=>{
 render(<PersonalWorkspace/>);fireEvent.click(screen.getByRole('button',{name:'Plan my day ↗'}));expect(screen.getByLabelText('Your request')).toHaveValue('Help me plan my day. Ask what matters most before making a schedule.');expect(screen.getByRole('button',{name:'Sending is not available in this preview'})).toBeDisabled();
});
