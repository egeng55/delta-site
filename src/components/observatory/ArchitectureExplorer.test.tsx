import { fireEvent,render,screen,within } from '@testing-library/react';
import ArchitectureExplorer from './ArchitectureExplorer';
import { observatoryPreview } from '@/lib/observatoryPreview';
jest.mock('./ArchitectureGraph',()=>({__esModule:true,default:()=> <div>Graph</div>}));
it('focuses, traverses and returns through relationships with evidence',()=>{
 render(<ArchitectureExplorer report={observatoryPreview()} />);
 fireEvent.click(screen.getByRole('button',{name:'Governance system · agent'}));
 expect(screen.getByRole('status')).toHaveTextContent('FOCUSED VIEW: Governance');
 fireEvent.click(within(screen.getByRole('complementary',{name:'Component evidence'})).getByRole('button',{name:'Reasoning'}));
 expect(screen.getByRole('status')).toHaveTextContent('FOCUSED VIEW: Reasoning');
 fireEvent.click(screen.getByRole('button',{name:'Back to previous component'}));
 expect(screen.getByRole('status')).toHaveTextContent('FOCUSED VIEW: Governance');
 fireEvent.change(screen.getByLabelText('Find a component'),{target:{value:'no-such-component'}});
 expect(screen.getByText(/No matches/)).toBeInTheDocument();
});
it('shows all declared dependencies by default and accounts for every link', () => {
 const report=observatoryPreview(); render(<ArchitectureExplorer report={report} />);
 expect(screen.getByRole('checkbox',{name:/Show cross-system dependencies/})).toBeChecked();
 expect(screen.getByText(`Ownership by repository and complete link inventory (${report.graphs[0].links.length})`)).toBeInTheDocument();
 expect(screen.getAllByRole('row')).toHaveLength(report.graphs[0].links.length+1);
});
