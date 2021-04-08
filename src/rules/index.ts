import {container} from 'tsyringe'

import {Branching} from './Branching'
import {PullsRequests} from './PullsRequests'

container.register('rules', {
  useValue: [container.resolve(Branching), container.resolve(PullsRequests)]
})
