import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as swr from 'swr';
import * as navigation from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { DataSourceContextType } from '@/hooks';
import DashboardLayout from '@/app/dashboard/layout';
import Topbar from '@/layout/Topbar';
import LeftSidebar from '@/layout/LeftSidebar';
import Footer from '@/layout/Footer';
import * as dataSourceHooks from '@/hooks/useDataSource';
import * as sessionHook from '@/hooks/useSession';

jest.mock('next/navigation');

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/layout/LeftSidebar', () => jest.fn(
  () => <div data-testid="LeftSidebar" />,
));

jest.mock('@/layout/Footer', () => jest.fn(
  () => <div data-testid="Footer" />,
));

jest.mock('@/layout/Topbar', () => jest.fn(
  () => <div data-testid="Topbar" />,
));

jest.mock('react-modal', () => ({
  setAppElement: jest.fn(),
}));

describe('DashboardLayout', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    swr.mutate('/state/theme', undefined);
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: true } as DataSourceContextType,
    );

    mockRouterPush = jest.fn();
    jest.spyOn(navigation, 'useRouter').mockImplementation(() => ({
      push: mockRouterPush as AppRouterInstance['push'],
    } as AppRouterInstance));

    jest.spyOn(sessionHook, 'default').mockReturnValue({
      isAuthenticated: true,
    } as sessionHook.SessionReturn);
  });

  it('returns loading when datasource not available', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: false } as DataSourceContextType,
    );
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    const html = document.documentElement;
    await waitFor(() => expect(html).toHaveClass('dark'));

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(Topbar).toBeCalledTimes(0);
    expect(LeftSidebar).toBeCalledTimes(0);
    expect(Footer).toBeCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('sets system theme', async () => {
    render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );
    const html = document.documentElement;

    await waitFor(() => expect(html).toHaveClass('dark'));
  });

  it('sets localstorage theme', async () => {
    localStorage.setItem('theme', 'light');
    render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );
    const html = document.documentElement;

    await waitFor(() => expect(html.classList).toHaveLength(0));
  });

  it('renders as expected when datasource available', async () => {
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    await screen.findByTestId('child');
    expect(Topbar).toHaveBeenLastCalledWith({}, {});
    expect(LeftSidebar).toHaveBeenLastCalledWith({}, {});
    expect(Footer).toHaveBeenLastCalledWith({}, {});
    expect(container).toMatchSnapshot();
  });

  it('redirects to /user/login if not authenticated and has loaded', async () => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as sessionHook.SessionReturn);

    render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    await waitFor(() => expect(mockRouterPush).toBeCalledWith('/user/login'));
  });
});
