Rails.application.routes.draw do
  devise_for :users

  resources :projects do
    resources :tasks, only: [ :index, :create, :update ]
  end
end
