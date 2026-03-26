Rails.application.routes.draw do
  devise_for :users, controllers: { sessions: "users/sessions", registrations: "users/registrations" }

  resources :projects do
    resources :tasks, only: [ :index, :create, :update ]
  end

  get "dashboard", to: "dashboard#index"
  root "dashboard#index"
end
