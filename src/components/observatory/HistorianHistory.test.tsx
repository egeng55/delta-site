import {render,screen,fireEvent,within} from '@testing-library/react';
import HistorianHistory from './HistorianHistory';
import archive from '@/lib/historianArchive.json';
const original=global.fetch;
beforeEach(()=>{global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>archive});});
afterEach(()=>{global.fetch=original;});
it('keeps the real archive behind sign-in in preview mode',()=>{render(<HistorianHistory preview/>);expect(fetch).not.toHaveBeenCalled();expect(screen.getByText(/Sign in to the private workspace/)).toBeInTheDocument();});
it('selects historical milestones, filters tracks, and explains the census test scope',async()=>{
 render(<HistorianHistory/>);await screen.findByText('Delta through time.');
 fireEvent.click(screen.getByRole('button',{name:/Dec 26, 2025 Delta Origin/}));
 expect(within(screen.getByRole('article',{name:'Selected milestone'})).getByRole('heading',{name:'Delta Origin'})).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Milestone track'),{target:{value:'product_intelligence'}});
 expect(screen.queryByRole('button',{name:/Failure Triage/})).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Census metric'),{target:{value:'unique_tests'}});
 expect(screen.getByRole('img',{name:'Unique tests: 365 to 417'})).toBeInTheDocument();
 expect(screen.getByText(/not every repository’s test suite/)).toBeInTheDocument();
});
it('shows an unavailable state with retry on an unauthorized or failed read',async()=>{jest.mocked(fetch).mockResolvedValue({ok:false} as Response);render(<HistorianHistory/>);expect(await screen.findByRole('button',{name:'Retry history'})).toBeInTheDocument();expect(screen.queryByText('Delta through time.')).not.toBeInTheDocument();});
