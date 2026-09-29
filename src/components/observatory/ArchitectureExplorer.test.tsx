import { fireEvent,render,screen } from '@testing-library/react';
import ArchitectureExplorer from './ArchitectureExplorer';
import { observatoryPreview } from '@/lib/observatoryPreview';
jest.mock('./ArchitectureGraph',()=>({__esModule:true,default:()=> <div>Graph</div>}));
it('focuses, traverses and returns through relationships with evidence',()=>{
 render(<ArchitectureExplorer report={observatoryPreview()} />);
 fireEvent.click(screen.getByRole('button',{name:'Governance system · agent'}));
 expect(screen.getByRole('status')).toHaveTextContent('FOCUSED VIEW: Governance');
 fireEvent.click(screen.getByRole('button',{name:'Reasoning'}));
 expect(screen.getByRole('status')).toHaveTextContent('FOCUSED VIEW: Reasoning');
 fireEvent.click(screen.getByRole('button',{name:'Back to previous component'}));
 expect(screen.getByRole('status')).toHaveTextContent('FOCUSED VIEW: Governance');
 fireEvent.change(screen.getByLabelText('Find a component'),{target:{value:'no-such-component'}});
 expect(screen.getByText(/No matches/)).toBeInTheDocument();
});
