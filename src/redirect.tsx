import React from 'react';
import { router } from './router';

export function Redirect({ to, push }: { to: string; push?: boolean }) {
	React.useEffect(() => {
		if (push) {
			router.push({ pathname: to });
		} else {
			router.replace({ pathname: to });
		}
	}, [to, push]);

	return <span />;
}
